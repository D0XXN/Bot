const {
    Client,
    GatewayIntentBits,
    ActivityOptions,
    Presence,
} = require("discord.js");
const fs = require("fs");
const keepAlive = require("./server.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let whitelist = new Set();
let userCodes = {};

// 화이트리스트 파일 로드
const loadWhitelist = () => {
    try {
        const data = fs.readFileSync("whitelist.json", "utf8");
        const parsedData = JSON.parse(data);
        whitelist = new Set(parsedData.whitelist);
    } catch (err) {
        console.log("No whitelist found, starting with an empty list.");
        whitelist = new Set();
    }
};

// 고유번호 파일 로드
const loadUserCodes = () => {
    try {
        const data = fs.readFileSync("userCodes.json", "utf8");
        userCodes = JSON.parse(data);
    } catch (err) {
        console.log("No previous user codes found, starting fresh.");
        userCodes = {};
    }
};

// 고유번호 파일 저장
const saveUserCodes = () => {
    fs.writeFileSync(
        "userCodes.json",
        JSON.stringify(userCodes, null, 2),
        "utf8",
    );
};

// 봇이 준비되었을 때 실행되는 이벤트
client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    loadWhitelist(); // 봇이 시작될 때 화이트리스트 로드
    loadUserCodes(); // 봇이 시작될 때 고유번호 로드
    client.user.setActivity("24시간 감시중", { type: "WATCHING" });
});

client.on('messageCreate', message => {
    // 메시지가 봇이 아닌 사용자로부터 온 경우에만 처리
    if (!message.author.bot) {
        // 메시지가 !ping일 때
        if (message.content.toLowerCase() === '!ping') {
            const pingEmbed = {
                color: 0x00ff00, // Embed 색상 (녹색)
                title: 'Pong!',
                description: `봇의 핑은 현재 ${client.ws.ping}ms 입니다.`,
            };
            message.channel.send({ embeds: [pingEmbed] });
        }
    }
});

// 유저가 서버에 입장했을 때 실행되는 이벤트
client.on("guildMemberAdd", (member) => {
    if (member.user.bot) {
        console.log("Bot has joined, no action taken.");
        return;
    }

    if (whitelist.has(member.id)) {
        let uniqueCode;
        if (userCodes[member.id]) {
            uniqueCode = userCodes[member.id];
        } else {
            uniqueCode = Math.floor(1000 + Math.random() * 9000); // 1000-9999 사이의 랜덤한 고유번호 생성
            userCodes[member.id] = uniqueCode;
            saveUserCodes(); // 새 고유번호를 생성하고 파일에 저장
        }
        member
            .send(`환영합니다! 당신의 고유번호는 ${uniqueCode}입니다.`)
            .catch(console.error);
    } else {
        member
            .send(
                "죄송합니다, 당신은 이 서버에 접속할 수 있는 권한이 없습니다.",
            )
            .then(() => member.kick("Not in whitelist"))
            .catch(console.error);
    }
});

keepAlive();
// 봇 토큰으로 실행
client.login(process.env["TOKEN"]);
