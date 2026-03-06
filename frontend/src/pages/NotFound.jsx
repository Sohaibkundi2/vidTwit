import { useEffect } from "react"
import { Link } from "react-router-dom"
import "./NotFound.css"

export default function NotFound() {
  useEffect(() => {
    document.body.classList.add("not-found-body")

    return () => {
      document.body.classList.remove("not-found-body")
    }
  }, [])

  return (
    <section className="not-found-shell">
      <div className="not-found-grid" aria-hidden="true" />
      <div className="not-found-orbit not-found-orbit-one" aria-hidden="true" />
      <div className="not-found-orbit not-found-orbit-two" aria-hidden="true" />
      <div className="not-found-glow not-found-glow-one" aria-hidden="true" />
      <div className="not-found-glow not-found-glow-two" aria-hidden="true" />

      <div className="not-found-stage">
        <div className="not-found-layout">
          <div className="not-found-copy">
            <div className="not-found-pill">
              Route signal lost in the vidTwit network
            </div>

            <p className="not-found-eyebrow">Error 404</p>
            <h1 className="not-found-title">
                This page drifted
                <span className="not-found-title-accent">
                  outside the stream.
                </span>
            </h1>

            <p className="not-found-text">
              The page is missing or the link is outdated. Jump back to the main feed and keep browsing.
            </p>

            <div className="not-found-actions">
              <Link to="/" className="not-found-button not-found-button-primary">
                Return Home
              </Link>
              <Link to="/videos" className="not-found-button not-found-button-secondary">
                Browse Videos
              </Link>
            </div>
          </div>

          <div>
            <div className="not-found-card">
              <div className="not-found-card-top">
                <div>
                  <p className="not-found-card-label">Signal Snapshot</p>
                  <p className="not-found-code">404</p>
                </div>
                <div className="not-found-status">
                  <p className="not-found-card-label">Status</p>
                  <span className="not-found-status-value">Unreachable</span>
                </div>
              </div>

              <div className="not-found-rows">
                <div className="not-found-row">
                  <strong>Navigation pulse</strong>
                  <span>Searching</span>
                </div>
                <div className="not-found-row">
                  <strong>Content node</strong>
                  <span>Missing</span>
                </div>
                <div className="not-found-row">
                  <strong>Next step</strong>
                  <span>Return to feed</span>
                </div>
              </div>

              <div className="not-found-signal">
                <div className="not-found-wave" aria-hidden="true" />
                <div className="not-found-bars">
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                  <span className="not-found-bar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}