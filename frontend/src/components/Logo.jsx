import {Link} from "react-router-dom";

function Logo() {
    return (
        <Link to="/" className="pn-brand" aria-label="PitchNode home">
            <span className="pn-node" aria-hidden="true" />
            PitchNODE
        </Link>
    );
}

export default Logo;