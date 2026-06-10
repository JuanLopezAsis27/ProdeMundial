import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="welcome">

      <!-- Hero -->
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="badge">USA · CANADÁ · MÉXICO</div>
          <h1 class="hero-title">
            <span class="title-26">26</span>
            <span class="title-mundial">MUNDIAL</span>
          </h1>
          <p class="hero-sub">PRODE</p>
          <p class="hero-desc">
            Predecí los partidos del Mundial 2026, formá tu grupo con amigos
            y compitan por ser el mejor .
          </p>
          <div class="hero-actions">
            <a routerLink="/auth/registro" class="btn-hero-primary">Empezar</a>
            <a routerLink="/auth/login" class="btn-hero-secondary">Ya tengo cuenta</a>
          </div>
        </div>
        <div class="hero-deco">
          <div class="deco-circle c1"></div>
          <div class="deco-circle c2"></div>
          <div class="deco-circle c3"></div>
        </div>
      </section>

      <!-- Features -->
      <section class="features">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon" style="background: rgba(212,0,26,.15); color: #D4001A;">⚽</div>
            <h3>Predecí cada partido</h3>
            <p>Ingresá tu marcador antes del pitazo inicial. Resultado exacto vale 3 puntos, ganador/empate correcto vale 1.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background: rgba(107,33,214,.15); color: #A855F7;">👥</div>
            <h3>Creá tu grupo</h3>
            <p>Invitá amigos, compañeros o familia con un código único. Cada grupo tiene su propia tabla de posiciones.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background: rgba(197,224,0,.12); color: #C5E000;">🏆</div>
            <h3>Seguí el torneo</h3>
            <p>Mirá todos los grupos y el bracket de eliminatorias. Se actualiza en tiempo real a medida que se juegan los partidos.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon" style="background: rgba(212,0,26,.1); color: #FF6B6B;">📊</div>
            <h3>Tabla en vivo</h3>
            <p>Los puntos se calculan automáticamente cuando termina cada partido. Sabé tu posición al instante.</p>
          </div>
        </div>
      </section>

      <!-- Scoring -->
      <section class="scoring">
        <h2>Sistema de puntuación</h2>
        <div class="scoring-cards">
          <div class="scoring-card gold">
            <span class="pts">3</span>
            <span class="pts-label">puntos</span>
            <span class="pts-desc">Resultado exacto</span>
          </div>
          <div class="scoring-card silver">
            <span class="pts">1</span>
            <span class="pts-label">punto</span>
            <span class="pts-desc">Ganador / Empate correcto</span>
          </div>
          <div class="scoring-card bronze">
            <span class="pts">0</span>
            <span class="pts-label">puntos</span>
            <span class="pts-desc">Resultado incorrecto</span>
          </div>
        </div>
      </section>

      <!-- CTA final -->
      <section class="cta">
        <h2>¿Listo para el Mundial?</h2>
        <p>El torneo arranca pronto. Registrate ahora y no te pierdas ni una predicción.</p>
        <a routerLink="/auth/registro" class="btn-cta">Crear cuenta gratis</a>
      </section>

      <footer class="footer">
        <span>Mundial 2026 Predicciones &copy; 2026</span>
      </footer>
    </div>
  `,
  styles: [`
    .welcome {
      min-height: 100vh;
      background: #0A0A0A;
      color: white;
    }

    /* Hero */
    .hero {
      position: relative;
      overflow: hidden;
      padding: 80px 24px 100px;
      text-align: center;
      background: linear-gradient(160deg, #0A0A0A 0%, #1A0A2E 50%, #0A0A0A 100%);
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 50% at 20% 50%, rgba(212,0,26,.25) 0%, transparent 70%),
        radial-gradient(ellipse 50% 60% at 80% 30%, rgba(107,33,214,.2) 0%, transparent 70%);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 700px;
      margin: 0 auto;
    }

    .badge {
      display: inline-block;
      background: rgba(197,224,0,.12);
      color: #C5E000;
      border: 1px solid rgba(197,224,0,.3);
      border-radius: 100px;
      padding: 6px 18px;
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .hero-title {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .title-26 {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 7rem;
      font-weight: 900;
      line-height: .9;
      background: linear-gradient(135deg, #D4001A 0%, #6B21D6 60%, #C5E000 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .title-mundial {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 3.8rem;
      font-weight: 900;
      letter-spacing: .06em;
      color: white;
    }

    .hero-sub {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.4rem;
      font-weight: 600;
      color: rgba(255,255,255,.5);
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 20px;
    }

    .hero-desc {
      font-size: 1.1rem;
      color: rgba(255,255,255,.7);
      line-height: 1.6;
      max-width: 520px;
      margin: 0 auto 36px;
    }

    .hero-actions {
      display: flex;
      gap: 14px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-hero-primary {
      background: #D4001A;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: .06em;
      transition: background .15s, transform .15s;
      display: inline-block;
    }
    .btn-hero-primary:hover { background: #A80015; transform: translateY(-1px); }

    .btn-hero-secondary {
      background: transparent;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,.25);
      font-weight: 600;
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: .06em;
      transition: border-color .15s, background .15s;
      display: inline-block;
    }
    .btn-hero-secondary:hover { border-color: white; background: rgba(255,255,255,.06); }

    /* Deco circles */
    .hero-deco { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .deco-circle {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,.05);
    }
    .c1 { width: 500px; height: 500px; top: -200px; right: -150px; }
    .c2 { width: 300px; height: 300px; bottom: -100px; left: -80px; border-color: rgba(212,0,26,.1); }
    .c3 { width: 200px; height: 200px; top: 20%; left: 5%; border-color: rgba(197,224,0,.08); }

    /* Features */
    .features {
      padding: 72px 24px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }

    .feature-card {
      background: #1A1A28;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      padding: 28px 24px;
      transition: border-color .2s, transform .2s;
    }
    .feature-card:hover { border-color: rgba(255,255,255,.18); transform: translateY(-2px); }

    .feature-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .feature-card h3 {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: .03em;
    }

    .feature-card p {
      font-size: .9rem;
      color: rgba(255,255,255,.55);
      line-height: 1.6;
    }

    /* Scoring */
    .scoring {
      background: #111118;
      padding: 72px 24px;
      text-align: center;
    }

    .scoring h2 {
      font-size: 2rem;
      margin-bottom: 40px;
      color: white;
    }

    .scoring-cards {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
      max-width: 700px;
      margin: 0 auto;
    }

    .scoring-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #1A1A28;
      border-radius: 14px;
      padding: 28px 32px;
      border: 1px solid rgba(255,255,255,.08);
      min-width: 160px;
      gap: 4px;
    }

    .scoring-card.gold .pts { color: #C5E000; }
    .scoring-card.silver .pts { color: rgba(255,255,255,.8); }
    .scoring-card.bronze .pts { color: rgba(255,255,255,.3); }

    .pts {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 3.5rem;
      font-weight: 900;
      line-height: 1;
    }
    .pts-label {
      font-size: .8rem;
      color: rgba(255,255,255,.4);
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .pts-desc {
      margin-top: 8px;
      font-size: .9rem;
      color: rgba(255,255,255,.65);
    }

    /* CTA */
    .cta {
      padding: 80px 24px;
      text-align: center;
      background: linear-gradient(135deg, rgba(212,0,26,.15) 0%, rgba(107,33,214,.15) 100%);
      border-top: 1px solid rgba(255,255,255,.06);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }

    .cta h2 {
      font-size: 2.4rem;
      margin-bottom: 12px;
    }

    .cta p {
      color: rgba(255,255,255,.6);
      font-size: 1.05rem;
      margin-bottom: 32px;
    }

    .btn-cta {
      display: inline-block;
      background: linear-gradient(135deg, #D4001A, #6B21D6);
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.05rem;
      text-transform: uppercase;
      letter-spacing: .07em;
      transition: opacity .15s, transform .15s;
    }
    .btn-cta:hover { opacity: .88; transform: translateY(-1px); }

    /* Footer */
    .footer {
      padding: 24px;
      text-align: center;
      font-size: .8rem;
      color: rgba(255,255,255,.25);
    }
  `]
})
export class Welcome {}
