type HomeProps = { onExplore: () => void }

export function Home({ onExplore }: HomeProps) {
  return <section className="home-hero" id="base-camp" data-checkpoint={0} aria-labelledby="title-base-camp">
    <div className="home-backdrop" aria-hidden="true" />
    <div className="home-layout">
      <div className="home-identity-shell">
        <div className="home-identity"><p>Changmu Heo</p><span>Product Designer</span></div>
      </div>
      <div className="home-main">
        <div className="home-statement">
          <h1 id="title-base-camp" tabIndex={-1} aria-label="Complexity, made clear.">
            <span className="hero-line hero-line-first"><span><span className="hero-reveal">Complexity,</span></span></span>
            <span className="hero-line hero-line-second"><span><span className="hero-reveal">made clear<span className="hero-period">.</span></span></span></span>
          </h1>
          <div className="home-copy-shell"><p className="home-intro"><span>복잡한 데이터와 흐름을 정리해</span>{' '}<span>이해하기 쉬운 제품으로 바꿔요.</span></p></div>
        </div>
        <div className="home-action-shell">
          <button type="button" className="home-explore" onClick={onExplore} aria-label="ASCEND — About으로 이동해요">
            <span>ASCEND</span>
            <svg viewBox="0 0 24 32" fill="none" aria-hidden="true"><path d="M12.5 2v27M3.5 20l9 9 9-9" /></svg>
          </button>
        </div>
      </div>
    </div>
  </section>
}
