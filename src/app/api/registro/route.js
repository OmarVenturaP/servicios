import { NextResponse } from "next/server";
import { connection } from "next/server";
import { registerProvider, AdminError } from "@/services/admin";

export async function POST(request) {
  await connection();
  try {
    const body = await request.json();
    const result = await registerProvider(body, request.url);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof AdminError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: "No se pudo completar el registro." }, { status: 500 });
  }
}
