import "reflect-metadata"
import { createServer } from "http"
import type { Socket } from "net"
import next from "next"
import { parse } from "url"

const dev = process.env.NODE_ENV !== "production"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
    const sockets = new Set<Socket>()
    let isShuttingDown = false

    const server = createServer(async (req, res) => {
        try {
            // Reject new requests during shutdown
            if (isShuttingDown) {
                res.statusCode = 503
                res.setHeader("Connection", "close")
                res.end("Server is shutting down")
                return
            }

            const parsedUrl = parse(req.url || "/", true)

            // Health check
            if (parsedUrl.pathname === "/health") {
                res.statusCode = 200
                res.setHeader("Content-Type", "application/json")
                res.end(
                    JSON.stringify({
                        status: "ok",
                    }),
                )
                return
            }

            await handle(req, res, parsedUrl)
        } catch (err) {
            console.error("Request handler error:", err)

            if (!res.headersSent) {
                res.statusCode = 500
                res.end("Internal Server Error")
            }
        }
    })

    // Track sockets
    server.on("connection", (socket) => {
        sockets.add(socket)

        socket.on("close", () => {
            sockets.delete(socket)
        })
    })

    server.listen(port, () => {
        console.log(
            `> Custom Next.js server listening on http://localhost:${port}`,
        )
    })

    const gracefulShutdown = async (signal: string) => {
        if (isShuttingDown) return

        isShuttingDown = true

        console.log(`Received ${signal}, shutting down gracefully...`)

        // Stop accepting new connections
        server.close((err) => {
            if (err) {
                console.error("Error during server close:", err)
                process.exit(1)
            }

            console.log("HTTP server closed")
            process.exit(0)
        })

        // Force close after timeout
        const FORCE_TIMEOUT = 10_000

        setTimeout(() => {
            console.warn("Force closing remaining connections...")

            sockets.forEach((socket) => {
                socket.destroy()
            })

            process.exit(1)
        }, FORCE_TIMEOUT).unref()
    }

    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

    process.on("unhandledRejection", (reason) => {
        console.error("Unhandled Rejection:", reason)
    })

    process.on("uncaughtException", (err) => {
        console.error("Uncaught Exception:", err)
        gracefulShutdown("uncaughtException")
    })
}).catch((err) => {
    console.error("Failed to start server:", err)
    process.exit(1)
})