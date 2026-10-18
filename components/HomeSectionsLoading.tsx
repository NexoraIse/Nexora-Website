export default function HomeSectionsLoading() {
  return (
    <section
      className="home-sections-loading"
      aria-label="Loading Nexora community and event previews"
      aria-busy="true"
    >
      <div className="home-sections-loading-inner">
        <div className="home-sections-loading-line" />
        <div className="home-sections-loading-panel" />
      </div>
    </section>
  );
}
