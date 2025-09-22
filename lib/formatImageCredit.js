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
  const licenseLabel = credit.license || null;
  const byLabel = t ? t('imageCreditBy') : 'by';
  const labelText = t ? t('imageCreditLabel') : null;
  let prefix = typeof credit.prefix === 'string' ? credit.prefix.trim() : null;
  if (prefix && labelText && labelText.toLowerCase().includes('image credit') && prefix === 'Fotocredit') {
    prefix = 'Photo credit';
  }

  if (credit.text) {
    const text = prefix && !credit.text.trim().startsWith(prefix)
      ? `${prefix} • ${credit.text}`
      : credit.text;

    return {
      text,
      licenseLabel: licenseUrl ? licenseLabel : null,
      licenseUrl: licenseUrl || null,
    };
  }

  const segments = [];
  if (prefix) {
    segments.push(prefix);
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

  if (credit.license && !licenseUrl) {
    details.push(credit.license);
  }

  if (details.length > 0) {
    segments.push(details.join(', '));
  }

  const text = segments.join(' • ').trim();

  return {
    text,
    licenseLabel: licenseUrl ? licenseLabel : null,
    licenseUrl: licenseUrl || null,
  };
}
