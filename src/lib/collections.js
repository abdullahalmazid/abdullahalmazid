/**
 * Firestore collection names used by this site.
 *
 * They are deliberately different from the ones my-portfolio-app2 uses
 * (pages, settings, sections, messages, projects, publications, blogs,
 * experience, education, gallery), so both sites can share one Firebase
 * project without reading or overwriting each other's documents.
 */
export const COL = {
  site: 'site', //       site/config, site/schema
  pages: 'tabs', //      one document per tab
  items: 'items', //     every list entry
  messages: 'inbox', //  contact form
  admins: 'admins', //   editors and their permissions
};
