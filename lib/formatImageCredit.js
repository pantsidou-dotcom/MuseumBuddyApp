const LICENSE_URLS = {
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'Public Domain Mark': 'https://creativecommons.org/publicdomain/mark/1.0/',
  'Unsplash License': 'https://unsplash.com/license',
};

function resolveLicenseUrl(credit) {
  if (!credit || !credit.license) return null;
  if (credit.licenseUrl) return credit.licenseUrl;
  const normalized = credit.license.trim();
  return LICENSE_URLS[normalized] || null;
}

export default function formatImageCredit(credit, t) {
  if (!credit) return null;

  const licenseUrl = resolveLicenseUrl(credit);
  const licenseLabel = typeof credit.license === 'string' ? credit.license.trim() : null;
  const byLabel = t ? t('imageCreditBy') : 'by';
  const labelText = t ? t('imageCreditLabel') : null;
  let prefix = typeof credit.prefix === 'string' ? credit.prefix.trim() : null;
  if (prefix && labelText && labelText.toLowerCase().includes('image credit') && prefix === 'Fotocredit') {
    prefix = 'Photo credit';
  }

  const sourceLabel = typeof credit.source === 'string' ? credit.source.trim() : null;
  const sourceUrl = typeof credit.url === 'string' && credit.url.trim() ? credit.url : null;

  let text = null;

  if (typeof credit.text === 'string' && credit.text.trim()) {
    const trimmed = credit.text.trim();
    if (prefix && !trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
      text = `${prefix} ${trimmed}`;
    } else {
      text = trimmed;
    }
  } else {
    const textSegments = [];

    if (prefix) {
      textSegments.push(prefix);
    }

    const details = [];
    const hasTitle = Boolean(credit.title);
    const hasAuthor = Boolean(credit.author);

    if (hasTitle && hasAuthor) {
      details.push(`${credit.title} ${byLabel} ${credit.author}`);
    } else if (hasTitle) {
      details.push(credit.title);
    } else if (hasAuthor) {
      details.push(prefix ? credit.author : `${byLabel} ${credit.author}`);
    }

    if (details.length > 0) {
      textSegments.push(details.join(', '));
    }

    text = textSegments.join(' • ').trim();
  }

  const segments = [];

  if (text) {
    segments.push({ key: 'text', label: text, url: null });
  }

  if (licenseLabel) {
    segments.push({ key: 'license', label: licenseLabel, url: licenseUrl || null });
  }

  if (sourceLabel) {
    segments.push({ key: 'source', label: sourceLabel, url: sourceUrl });
  }

  return {
    text,
    licenseLabel,
    licenseUrl: licenseUrl || null,
    sourceLabel,
    sourceUrl,
    segments,
  };
}
