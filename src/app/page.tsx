export default function Home() {
  const host = process.env.HOST_NAME || "demoapp.viladomat.com";
  const dbHost = process.env.DB_HOST || "10.42.81.5";
  const database = process.env.MYSQL_DATABASE || "demodb";

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">Docker Swarm · Portainer · Traefik</p>
        <h1>Demo Next.js funcionando</h1>
        <p className="lead">
          Aplicación mínima desplegada desde un repositorio Git, usando una imagen oficial de Node.js y una base MySQL externa.
        </p>

        <div className="grid">
          <div>
            <span>Host público</span>
            <strong>{host}</strong>
          </div>
          <div>
            <span>MySQL</span>
            <strong>{dbHost}</strong>
          </div>
          <div>
            <span>Base de datos</span>
            <strong>{database}</strong>
          </div>
        </div>

        <div className="actions">
          <a href="/api/health">Healthcheck</a>
          <a href="/api/db">Probar MySQL</a>
        </div>
      </section>
    </main>
  );
}
