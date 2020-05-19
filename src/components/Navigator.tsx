import React from "react"
import {Link} from "react-router-dom"

export default () => (
    <div className="navigator">
        <ul className="navigation-list">
            <li>
                <Link to="/">Videos</Link>
            </li>
            <li>
                <Link to="/schedule">Schedule</Link>
            </li>
            <li>
                <Link to="/active">Active Downloads</Link>
            </li>
            <li>
                <Link to="/service-information">Service Information</Link>
            </li>
            <li>
                <Link to="/settings">Settings</Link>
            </li>

        </ul>
    </div>
)
