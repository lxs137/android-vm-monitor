### API

#### 1.获取虚拟机列表
- url: GET /vms
- response: [{ name: string, wxid: string, ip: string }]

#### 2.获取虚拟机详细信息
- url: GET /vm/:ip
- response: { name: string, ip: string, wxid: string, nickname: string, psList: string[], isNetConnected: boolean, isAdbConnected: boolean, isWechatForeground: boolean, updateTime: Date }

#### 3.获取虚拟机网络连接状态
- url: GET /vm/:ip/status/net
- response: { ip: string, isNetConnected: boolean }

#### 4.获取虚拟机Adb连接状态
- url: GET /vm/:ip/status/adb
- response: { ip: string, isAdbConnected: boolean }

#### 5.虚拟机微信界面是否在前台
- url: GET /vm/:ip/status/wechat
- response: { ip: string, isWechatForeground: boolean }

#### 6.获取虚拟机中微信进程
- url: GET /vm/:ip/status/ps
- response: { ip: string, psList: string[] }

#### 7.Adb重新连接
- url: POST /vm/:ip/status/adb
- response: { ip: string, isAdbConnected: boolean }

#### 8.将微信唤起到前台
- url: POST /vm/:ip/status/wechat
- response: { ip: string, isWechatForeground: boolean }
  

### websocket

#### 1.获取虚拟机画面
- url: /minicap
- query: { ip: string }
- example: "/minicap/?ip=114.212.80.19:10001"

