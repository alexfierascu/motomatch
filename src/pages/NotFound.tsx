import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 text-center md:px-8">
      <div className="ghost-index mx-auto text-[clamp(6rem,20vw,14rem)]">404</div>
      <h1 className="mt-4 font-display text-4xl uppercase">That page isn't here</h1>
      <p className="mt-3 text-sm text-muted">
        The bike you're looking for may have been renamed or removed from the dataset.
      </p>
      <Link to="/browse" className="btn btn-primary mt-8">
        Browse all bikes
      </Link>
    </div>
  );
}
