import os
import sys
import subprocess
import time
import signal

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Determine paths to binaries
    python_exe = os.path.join(root_dir, "backend", "venv", "bin", "python")
    if not os.path.exists(python_exe):
        python_exe = "python3" # System fallback
        
    print("==================================================================")
    print("         CAMPAIGN AUTOMATION AI OPERATING SYSTEM LAUNCHER        ")
    print("==================================================================")
    print(f"Backend Server: Port 8000  (FastAPI documentation at http://localhost:8000/docs)")
    print(f"Frontend Server: Port 3000 (UI Portal at http://localhost:3000)")
    print("------------------------------------------------------------------")
    print("Initializing servers...")

    # Start FastAPI Backend
    backend_proc = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=root_dir,
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    # Start React Vite Frontend
    # Use npm run dev (which binds to port 3000 as configured in vite.config.ts)
    # Check if node_modules exists
    if not os.path.exists(os.path.join(root_dir, "node_modules")):
        print("[Launcher] npm packages not detected. Installing frontend modules...")
        subprocess.run(["npm", "install"], cwd=root_dir)

    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=root_dir,
        stdout=sys.stdout,
        stderr=sys.stderr
    )

    def signal_handler(sig, frame):
        print("\n[Launcher] Shutting down active servers gracefully...")
        backend_proc.terminate()
        frontend_proc.terminate()
        
        # Wait for termination
        backend_proc.wait()
        frontend_proc.wait()
        print("[Launcher] Shutdown complete. Goodbye!")
        sys.exit(0)

    # Bind SIGINT / Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    print("\n[Launcher] System active. Press Ctrl+C to stop both servers.")
    print("==================================================================")

    # Keep script alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
