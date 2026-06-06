// import '../auth.form.scss';
import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {useAuth} from '../hooks/useAuth';


const Register = () => {

    const {loading, handleRegister} = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    const handleInputChange = (e) => {
        const inputName = e.target.name;
        const inputValue = e.target.value;

        setFormData((prev) => ({
            ...prev,
            [inputName] : inputValue
        }));

    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleRegister({username: formData.username, email: formData.email, password: formData.password});
        navigate('/login');
    }

    if(loading) {
        return(
            <h1>Loading.......</h1>
        )
    }

    return (
        <main className="auth">
            <div className='form-container'>

            <h1>Register</h1>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Username</label>
                    <input onChange={handleInputChange} type="text" id="username" name="username" placeholder="Enter username" value={formData.username} />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={handleInputChange} type="email" id="email" name="email" placeholder="Enter email address" value={formData.email} />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input onChange={handleInputChange} type="password" id="password" name="password" placeholder="Enter password" value={formData.password} />
                </div>
                <button className="button primary-button">Register</button>
            </form>

            <p>Already have an account? <Link to={'/login'}>Login</Link> </p>

            </div>
        </main>
    )
}

export default Register;