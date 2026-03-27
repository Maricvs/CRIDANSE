import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../services/axiosInstance'

interface DecodedToken {
  email: string
  sub: string
  name: string
  picture: string
}

interface OAuthResponse {
  message: string
  user_id: string
  access_token: string
  refresh_token: string
  token_type: string
}

const Auth = () => {
  const navigate = useNavigate()

  const handleSuccess = (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    const decoded: DecodedToken = jwtDecode(credentialResponse.credential)

    console.log('✅ Google decoded:', decoded)

    const guestToken = localStorage.getItem('user_token')

    axiosInstance.post<OAuthResponse>('/auth/oauth', {
      oauth_provider: 'google',
      provider_user_id: decoded.sub,
      email: decoded.email,
      full_name: decoded.name,
      avatar_url: decoded.picture,
    }, {
      headers: guestToken ? { 'X-Authorization': `Bearer ${guestToken}` } : {}
    })
      .then(response => {
        const data = response.data
        console.log('🟢 Response data:', data)
        console.log('🟢 Access token:', data.access_token)
        localStorage.setItem('user_id', data.user_id)
        localStorage.setItem('user_name', decoded.name)
        localStorage.setItem('user_token', data.access_token)
        localStorage.setItem('user_refresh_token', data.refresh_token)

        console.log('🟢 Saved token:', localStorage.getItem('user_token'))

        navigate('/')
      })
      .catch((err: Error) => {
        console.error('❌ Error sending to server:', err)
      })
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <h2>Welcome to CRIDANSE</h2>
        <p style={{ color: '#aaa', marginBottom: '2rem' }}>
          Sign in with Google to continue
        </p>
        <div className="auth-button">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Ошибка входа через Google')
            }}
            theme="filled_black"
            size="large"
            width="100%"
            max-width="300px"
          />
        </div>
      </div>
    </div>
  )
}

export default Auth
