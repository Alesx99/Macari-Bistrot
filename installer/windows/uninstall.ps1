$ErrorActionPreference = "SilentlyContinue"

netsh advfirewall firewall delete rule name="Macari Bistrot 4000 TCP" | Out-Null
schtasks /Delete /TN "MacariBistrotServer" /F | Out-Null
