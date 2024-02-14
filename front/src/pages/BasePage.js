import React, { useState } from "react";
import LoginForm from "../components/Login";


const BasePage = () => {
    const [showLoginForm, setShowLoginForm] = useState(false);

    const handleSignInClick = () => {
        setShowLoginForm(true);
    };

    return (
        <div>
            <h1>Base page</h1>
            <button onClick={handleSignInClick}>Sign In</button>
            {showLoginForm && <LoginForm />}
            
        </div>
    );
};

export default BasePage;
