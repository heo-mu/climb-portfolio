type HomeProps = { onExplore: () => void }

export function Home({ onExplore }: HomeProps) {
  return <section className="home-hero" id="base-camp" data-checkpoint={0} aria-labelledby="title-base-camp">
    <div className="home-backdrop" aria-hidden="true" />
    <div className="home-layout">
      <div className="home-statement">
        <h1 id="title-base-camp" tabIndex={-1} aria-label="Complexity, made clear.">
          <span className="hero-line hero-line-first"><span>Complexity,</span></span>
          <span className="hero-line hero-line-second"><span>made clear.</span></span>
        </h1>
      </div>
      <div className="home-support">
        <div className="home-identity"><p>Changmu Heo</p><span>Product Designer</span></div>
        <p className="home-intro"><span>복잡한 데이터와 흐름을 정리해</span>{' '}<span>이해하기 쉬운 제품으로 바꿔요.</span></p>
        <button type="button" className="home-explore" onClick={onExplore} aria-label="ASCEND — About으로 이동해요">
          <span>ASCEND</span>
          <svg viewBox="0 0 32 40" fill="none" aria-hidden="true"><path d="M16 3v32M4 23l12 12 12-12" /></svg>
        </button>
      </div>
    </div>
  </section>
}
