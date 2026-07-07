import { Link } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="pn-brand" aria-label="PitchNode home">
      <span className="pn-node" aria-hidden="true" />
      <span>
        Pitch<span className="pn-brand__accent">Node</span>
      </span>
    </Link>
  );
}

export default Logo;
