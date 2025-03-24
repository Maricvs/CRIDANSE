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

    console.log('✅ User info from Google:', decoded)

    // Отправка на бэкенд
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
        // например, сохранить user_id:
        localStorage.setItem('user_id', data.user_id)
      })
      .catch(err => console.error('❌ Ошибка при отправке:', err))
  }

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => console.log('❌ Login Failed')}
    />
  )
}

export default Auth
