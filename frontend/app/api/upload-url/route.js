import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type (runtime check)
    // Note: Accessing file.type relies on the 'file' object having this property at runtime.
    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Generate a unique filename
    // Note: Accessing file.name relies on the 'file' object having this property at runtime.
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `destinations/${nanoid()}.${fileExtension}`

    // Upload to Vercel Blob using the environment variable
    const blob = await put(uniqueFilename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN, // Ensure this env var is set
    })

    // Return the URL
    // Note: Accessing blob.url relies on the 'put' function returning an object
    // with a 'url' property at runtime.
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}