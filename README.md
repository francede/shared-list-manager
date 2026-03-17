# Shared List Manager

## Getting Started

```bash
npm run dev
```

To run in WSL, run
```bash
npm run dev-wsl
```

## USB Debugging from WSL
From Android device enable dev mode and turn on USB debugging

From WSL shell, run
```bash
ip -4 addr show eth0 | grep inet
```
And copy the 172.x.x.x address.

From powershell as admin, run

```bash
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3000 connectaddress=172.x.x.x connectport=3000

adb start-server
adb reverse tcp:3000 tcp:3000
```

To revert the rule, run

```bash
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=3000
```