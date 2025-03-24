import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import jwt_decode from 'jwt-decode'

interface DecodedToken {
  email: string
  sub: string
  name: string
  picture: string
}

const Auth = () => {
  const handleSuccess = (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    const decoded: DecodedToken = jwt_decode(credentialResponse.credential)

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
      })
      .catch(err => {
        console.error('❌ Ошибка при отправке на сервер:', err)
      })
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f0f0f0' }}>
      <h2>СТРАНИЦА АВТОРИЗАЦИИ</h2>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.log('❌ Google Login Failed')
        }}
      />
    </div>
  )
}
export default Auth
