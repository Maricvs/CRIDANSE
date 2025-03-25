import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom' // ✅ добавлен для навигации

interface DecodedToken {
  email: string
  sub: string
  name: string
  picture: string
}

const Auth = () => {
  const navigate = useNavigate() // ✅ хук для редиректа

  const handleSuccess = (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    const decoded: DecodedToken = jwtDecode(credentialResponse.credential)

    console.log('✅ Google decoded:', decoded)

    fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oauth_provider: 'google',
        provider_user_id: decoded.sub,
        email: decoded.email,
        full_name: decoded.name,
        avatar_url: decoded.picture,
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('🟢 Saved to backend:', data)
        localStorage.setItem('user_id', data.user_id)
        localStorage.setItem('user_name', decoded.name) // опционально
        navigate('/') // ✅ редирект на главную (или /chat, /profile)
      })
      .catch(err => {
        console.error('❌ Ошибка при отправке на сервер:', err)
      })
  }

  return (
    <div className="auth-container">
      <h2>Вход через Google</h2>
      <div className="auth-button">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            console.log('❌ Google Login Failed')
          }}
        />
      </div>
    </div>
  )
}

export default Auth
