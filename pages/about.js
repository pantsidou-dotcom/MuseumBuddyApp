import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  const emailAddress = 'info@museumbuddy.nl';
  const whatItems = t('aboutWhatItems');
  const contactBody = t('aboutContactBody', { email: emailAddress });
  const [contactPrefix = '', contactSuffix = ''] = contactBody.split(emailAddress);

  return (
    <>
      <SEO title={t('aboutTitle')} />
      <h1 className="page-title">{t('aboutTitle')}</h1>
      <p>{t('aboutIntro')}</p>
      <section>
        <h2>{t('aboutWhatTitle')}</h2>
        <ul>
          {Array.isArray(whatItems)
            ? whatItems.map((item) => <li key={item}>{item}</li>)
            : null}
        </ul>
      </section>
      <section>
        <h2>{t('aboutActiveTitle')}</h2>
        <p>{t('aboutActiveBody')}</p>
      </section>
      <section>
        <h2>{t('aboutResponsibleTitle')}</h2>
        <p>{t('aboutResponsibleBody')}</p>
      </section>
      <section>
        <h2>{t('aboutContactTitle')}</h2>
        <p>
          {contactPrefix}
          <a href={`mailto:${emailAddress}`}>{emailAddress}</a>
          {contactSuffix}
        </p>
      </section>
    </>
  );
}
