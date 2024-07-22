import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat_id = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chat_id) {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 200 },
    );
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const message = `New message from ${payload.name}\nEmail: ${payload.email}\nMessage:\n ${payload.message}\n`;
    console.log(url, message)
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message,
        chat_id: process.env.TELEGRAM_CHAT_ID,
      }),
    };

    const response = await fetch(url, requestOptions);
    const res = await response.json();

    if (res.ok) {
      return NextResponse.json(
        {
          success: true,
          message: "Message sent successfully!",
          status: 200,
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        {
          message: "Message sending failed!",
          success: false,
          status: 500,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Message sending failed!",
        success: false,
        status: 500,
      },
      { status: 500 },
    );
  }
}
