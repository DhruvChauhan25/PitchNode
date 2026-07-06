function SessionStats({ participantCount }) {
    return (
        <div className="card mt-3">
                <div className="card-body text-center">
                    <h5>Session Statistics</h5>
                    <h3>{participantCount}</h3>
                    <p>Participants Connected</p>
                </div>
            </div>
    );
}

export default SessionStats;