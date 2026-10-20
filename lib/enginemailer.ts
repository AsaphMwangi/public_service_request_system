export async function sendEnginemailerEmail(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.ENGINEMAILER_API_KEY
  const senderEmail = process.env.ENGINEMAILER_SENDER_EMAIL || 'admin@publicservicerequestsystem.asaphmwangi.site'

  if (!apiKey) {
    console.error('Missing ENGINEMAILER_API_KEY')
    return { success: false, error: 'Missing API Key' }
  }

  try {
    const response = await fetch('https://api.enginemailer.com/RESTAPI/V2/Submission/SendEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'APIKey': apiKey
      },
      body: JSON.stringify({
        CampaignName: 'Muranga County Service Alerts',
        ToEmail: toEmail,
        Subject: subject,
        SenderEmail: senderEmail,
        SenderName: 'Muranga County eCitizen',
        SubmittedContent: htmlContent
      })
    })

    const data = await response.json()

    if (data?.Result?.StatusCode !== '200' && !response.ok) {
      console.error('Enginemailer API Error:', data)
      return { success: false, error: data }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Network Error:', error.message)
    return { success: false, error: error.message }
  }
}