import { useState } from 'react';
import '../auth.form.scss';
import { useNavigate, Link } from 'react-router';
import {useAuth} from '../hooks/useAuth';

const Login = () => {

    const {loading, handleLogin} = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleLogin({email: formData.email,password: formData.password});
        navigate('/');
    }

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleInputChange = (e) => {
        const inputName = e.target.name;
        const inputValue = e.target.value;
        setFormData((prev) => ({
            ...prev,
            [inputName]: inputValue
        }));
    }


    if(loading) {
        return (
            <main>
                <h1>Loading........</h1>
            </main>
        )
    }

    return (
        <main className='auth'>
            <div className='form-container'>

            <h1>Login</h1>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input onChange={handleInputChange} type="email" id="email" name="email" placeholder="Enter email address" value={formData.email}/>
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input onChange={handleInputChange} type="password" id="password" name="password" placeholder="Enter password" value={formData.password}/>
                </div>
                <button className="button primary-button">Login</button>
            </form>

            <p>Don't have an account? <Link to={'/register'}>Register</Link> </p>

            </div>
        </main>
    )
}

export default Login;