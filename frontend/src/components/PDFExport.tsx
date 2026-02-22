'use client'

import { useState } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { getComplianceInfo } from '@/utils/complianceHelpers'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'
import type { AssessmentResult } from '@/types/assessment'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dimTranslations: Record<string, any> = { de, en, fr }

/**
 * D1: PDF Report Export Button.
 * Generates a professional PDF report from assessment results.
 * Fully i18n-aware — outputs in the current locale.
 */

interface PDFExportProps {
  result: AssessmentResult
}

export default function PDFExport({ result }: PDFExportProps) {
  const { t, locale } = useLanguage()
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default

      const html = buildReportHTML(result, t, locale)

      const container = document.createElement('div')
      container.innerHTML = html
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (html2pdf() as any)
        .set({
          margin: [15, 15, 15, 15],
          filename: `governance-report-${result.scoping.system_name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(container)
        .save()

      document.body.removeChild(container)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="block w-full text-center bg-accent-purple text-white px-6 py-2.5 rounded-xl hover:bg-accent-indigo disabled:opacity-50 transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg"
    >
      {generating ? t('bento.pdfGenerating') : t('bento.pdfDownload')}
    </button>
  )
}

const LOCALE_MAP: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
}

/** Translate a dimension name by ID, falling back to the backend name */
function translateDimName(locale: string, dimId: string, fallback: string): string {
  return dimTranslations[locale]?.dimensions?.[dimId]?.name ?? fallback
}

function buildReportHTML(
  result: AssessmentResult,
  t: (key: string) => string,
  locale: string,
): string {
  const dateLocale = LOCALE_MAP[locale] || 'de-DE'
  const date = new Date().toLocaleDateString(dateLocale, {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const dimRows = result.dimensions.map(dim => {
    const compliance = getComplianceInfo(dim.dim_score)
    const statusColor = compliance.status === 'compliant' ? '#22c55e'
      : compliance.status === 'partial' ? '#eab308'
      : '#ef4444'
    const statusLabel = compliance.status === 'compliant' ? t('pdf.compliant')
      : compliance.status === 'partial' ? t('pdf.partial')
      : t('pdf.nonCompliant')
    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${dim.dimension_id}: ${translateDimName(locale, dim.dimension_id, dim.dimension_name)}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:700;">${dim.dim_score?.toFixed(1) ?? '\u2013'}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${statusColor};margin-right:4px;"></span>
          ${statusLabel}
        </td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#6b7280;">${dim.num_rated} ${t('pdf.rated')}, ${dim.num_na} N/A</td>
      </tr>
    `
  }).join('')

  const gapRows = result.gaps.map(gap => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:600;">${gap.dimension_id}: ${translateDimName(locale, gap.dimension_id, gap.dimension_name)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${gap.dim_score.toFixed(1)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">
        <span style="color:${gap.gap_severity === 'critical' ? '#ef4444' : gap.gap_severity === 'significant' ? '#f97316' : '#eab308'};font-weight:600;">${gap.gap_severity}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;">${gap.recommendation}</td>
    </tr>
  `).join('')

  const compliant = result.dimensions.filter(d => d.dim_score !== null && d.dim_score >= 3.5).length
  const partial = result.dimensions.filter(d => d.dim_score !== null && d.dim_score >= 2.0 && d.dim_score < 3.5).length
  const nonCompliant = result.dimensions.filter(d => d.dim_score !== null && d.dim_score < 2.0).length

  const summaryText = t('pdf.summaryText')
    .replace('{name}', result.scoping.system_name)
    .replace('{score}', result.overall_score.toFixed(1))
    .replace('{label}', result.maturity_label)
    .replace('{compliant}', String(compliant))
    .replace('{partial}', String(partial))
    .replace('{nonCompliant}', String(nonCompliant))

  return `
    <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1f2937;max-width:800px;margin:0 auto;">
      <div style="text-align:center;padding:60px 40px;border-bottom:3px solid #5C6BC0;">
        <h1 style="font-size:28px;color:#5C6BC0;margin-bottom:8px;">${t('pdf.reportTitle')}</h1>
        <h2 style="font-size:20px;color:#374151;font-weight:400;">${result.scoping.system_name}</h2>
        <p style="color:#6b7280;margin-top:20px;">${date}</p>
        <p style="color:#9ca3af;font-size:13px;margin-top:8px;">${result.scoping.industry} | ${result.scoping.risk_category} | ${result.scoping.organization_size}</p>
      </div>

      <div style="padding:30px 0;border-bottom:1px solid #e5e7eb;">
        <h3 style="font-size:18px;color:#5C6BC0;margin-bottom:16px;">${t('pdf.executiveSummary')}</h3>
        <div style="background:#f0f4ff;border-radius:8px;padding:20px;margin-bottom:16px;">
          <p style="font-size:14px;line-height:1.8;">${summaryText}</p>
        </div>
      </div>

      <div style="padding:30px 0;border-bottom:1px solid #e5e7eb;">
        <h3 style="font-size:18px;color:#5C6BC0;margin-bottom:16px;">${t('pdf.dimensionResults')}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e5e7eb;">${t('pdf.dimension')}</th>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">${t('pdf.score')}</th>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">${t('pdf.status')}</th>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">${t('pdf.details')}</th>
            </tr>
          </thead>
          <tbody>${dimRows}</tbody>
        </table>
      </div>

      ${result.gaps.length > 0 ? `
      <div style="padding:30px 0;border-bottom:1px solid #e5e7eb;">
        <h3 style="font-size:18px;color:#5C6BC0;margin-bottom:16px;">${t('pdf.gapAnalysis')}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e5e7eb;">${t('pdf.dimension')}</th>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">${t('pdf.score')}</th>
              <th style="padding:10px 8px;text-align:center;border-bottom:2px solid #e5e7eb;">${t('pdf.severity')}</th>
              <th style="padding:10px 8px;text-align:left;border-bottom:2px solid #e5e7eb;">${t('pdf.recommendation')}</th>
            </tr>
          </thead>
          <tbody>${gapRows}</tbody>
        </table>
      </div>
      ` : ''}

      <div style="padding:30px 0;">
        <h3 style="font-size:18px;color:#5C6BC0;margin-bottom:16px;">${t('pdf.methodology')}</h3>
        <p style="font-size:12px;color:#6b7280;line-height:1.8;">${t('pdf.methodologyText')}</p>
        <p style="font-size:11px;color:#9ca3af;margin-top:16px;">${t('pdf.generatedAt').replace('{date}', date)}</p>
      </div>
    </div>
  `
}
