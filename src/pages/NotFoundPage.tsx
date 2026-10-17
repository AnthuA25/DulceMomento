import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";

export function NotFoundPage() {
  return (
    <main className="welcome">
      <div className="welcome__content">
        <BrandMark className="welcome__brand" />
        <h1 className="welcome__title">No encontramos esta página</h1>
        <Link className="welcome__link" to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
