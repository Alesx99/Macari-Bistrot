#define MyAppName "Macari Bistrot"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Macari Bistrot"
#define MyAppExeName "backend\src\server.js"

[Setup]
AppId={{D6D0D830-DDEA-4CCF-B2FA-7C857001C95A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\Macari Bistrot
DefaultGroupName=Macari Bistrot
OutputDir=output
OutputBaseFilename=MacariBistrot-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "italian"; MessagesFile: "compiler:Languages\Italian.isl"

[Tasks]
Name: "desktopicons"; Description: "Crea collegamenti sul desktop"; GroupDescription: "Opzioni:"
Name: "firewall"; Description: "Apri porta 4000 nel firewall (rete privata)"; GroupDescription: "Rete locale:"
Name: "autostart"; Description: "Avvio automatico del server all'accesso Windows"; GroupDescription: "Servizio locale:"

[Files]
Source: "build\app\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs
Source: "postinstall.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion
Source: "uninstall.ps1"; DestDir: "{app}\installer"; Flags: ignoreversion

[Run]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\postinstall.ps1"" -InstallDir ""{app}"" -NodePath ""{code:GetNodePath}"" {code:GetFirewallFlag} {code:GetAutoStartFlag}"; Flags: runhidden waituntilterminated
Filename: "{code:GetNodePath}"; Parameters: """{app}\backend\src\db\seed.js"""; Flags: runhidden waituntilterminated
Filename: "{cmd}"; Parameters: "/c start http://localhost:4000/admin"; Description: "Apri admin nel browser"; Flags: postinstall nowait skipifsilent unchecked

[UninstallRun]
Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{app}\installer\uninstall.ps1"""; Flags: runhidden

[Icons]
Name: "{group}\Admin Macari Bistrot"; Filename: "http://localhost:4000/admin"
Name: "{group}\Menu pubblico"; Filename: "http://localhost:4000/"
Name: "{group}\QR Tavoli"; Filename: "http://localhost:4000/admin/qr"
Name: "{group}\Stampa menu"; Filename: "http://localhost:4000/print"
Name: "{group}\Disinstalla Macari Bistrot"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Admin Macari Bistrot"; Filename: "http://localhost:4000/admin"; Tasks: desktopicons
Name: "{autodesktop}\Menu pubblico"; Filename: "http://localhost:4000/"; Tasks: desktopicons

[Code]
function GetNodePath(Param: string): string;
var
  NodePath: string;
begin
  NodePath := ExpandConstant('{pf}\nodejs\node.exe');
  if FileExists(NodePath) then
  begin
    Result := NodePath;
    exit;
  end;
  MsgBox('Node.js LTS non trovato.' + #13#10 +
         'Installa Node.js 24 LTS da https://nodejs.org e rilancia il setup.',
         mbCriticalError, MB_OK);
  Abort;
end;

function GetFirewallFlag(Param: string): string;
begin
  if WizardIsTaskSelected('firewall') then
    Result := '-EnableFirewall'
  else
    Result := '';
end;

function GetAutoStartFlag(Param: string): string;
begin
  if WizardIsTaskSelected('autostart') then
    Result := '-EnableAutoStart'
  else
    Result := '';
end;
