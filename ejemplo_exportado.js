// ── Ejemplo · exportada de Demo Kit ──
// BPM = 128 | BARS = 8
// Demo autónoma: lleva dentro el proyecto editable (__DEMOKIT_PROJECT__) y el motor de Demo Kit,
// así que suena igual que en el estudio y se puede volver a abrir con «Convertir en editable» sin pérdidas.
// Solo necesita que la página aporte demoKit (demo_kit.js), como cualquier demo.
async function renderEjemplo(sr, onProg) {
  const __DEMOKIT_PROJECT__ = [
    "eyJmb3JtYXQiOiJkZW1va2l0LXN0dWRpbyIsInYiOjEsIm5hbWUiOiJFamVtcGxvIiwiYnBtIjoxMjgsImJhcnMiOjgsInNlZWQiOjIwMjYxMD",
    "E1LCJzYyI6eyJtb2RlIjoicGFyYW0iLCJkZXB0aCI6MC43LCJyZWwiOjAuMTQsInJhdGUiOjgwMH0sIm1hc3RlciI6eyJsb3ciOjMsImhpZ2gi",
    "OjAsImdhaW4iOjEsImxpbWl0Ijp0cnVlLCJjZWlsIjowLjk3fSwia2V5Ijp7InJvb3QiOjAsInNjYWxlIjoiTWF5b3IiLCJmaXQiOmZhbHNlfS",
    "widHJhY2tzIjpbeyJpZCI6InQxOWNoIiwibmFtZSI6IkJvbWJvIiwiaW5zdCI6ImtpY2siLCJwYXJhbXMiOnsiZ2FpbiI6MSwibG8iOjUwLCJo",
    "aSI6MTQwLCJrIjozNSwiZGVjIjo4LCJsZW4iOjAuNCwiY2xpY2siOjAuM30sInZvbCI6MSwicGFuIjowLCJtdXRlIjpmYWxzZSwic29sbyI6Zm",
    "Fsc2UsImR1Y2tlZCI6ZmFsc2UsInNjIjp0cnVlLCJub3RlcyI6W3siYiI6MCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxLCJsIjowLjI1",
    "LCJtIjowLCJ2IjoxfSx7ImIiOjIsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MywibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjo0LCJsIj",
    "owLjI1LCJtIjowLCJ2IjoxfSx7ImIiOjUsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6NiwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjo3",
    "LCJsIjowLjI1LCJtIjowLCJ2IjoxfSx7ImIiOjgsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6OSwibCI6MC4yNSwibSI6MCwidiI6MX0sey",
    "JiIjoxMCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxMSwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxMiwibCI6MC4yNSwibSI6MCwi",
    "diI6MX0seyJiIjoxMywibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxNCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxNSwibCI6MC4yNS",
    "wibSI6MCwidiI6MX0seyJiIjoxNiwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxNywibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxOCwi",
    "bCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoxOSwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyMCwibCI6MC4yNSwibSI6MCwidiI6MX0sey",
    "JiIjoyMSwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyMiwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyMywibCI6MC4yNSwibSI6MCwi",
    "diI6MX0seyJiIjoyNCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyNSwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyNiwibCI6MC4yNS",
    "wibSI6MCwidiI6MX0seyJiIjoyNywibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyOCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjoyOSwi",
    "bCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjozMCwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjozMSwibCI6MC4yNSwibSI6MCwidiI6MX1dfS",
    "x7ImlkIjoidDJ6ZG8iLCJuYW1lIjoiUGFsbWEiLCJpbnN0IjoiY2xhcCIsInBhcmFtcyI6eyJnYWluIjowLjV9LCJ2b2wiOjEsInBhbiI6MCwi",
    "bXV0ZSI6ZmFsc2UsInNvbG8iOmZhbHNlLCJkdWNrZWQiOmZhbHNlLCJzYyI6ZmFsc2UsIm5vdGVzIjpbeyJiIjoxLCJsIjowLjI1LCJtIjowLC",
    "J2IjoxfSx7ImIiOjMsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6NSwibCI6MC4yNSwibSI6MCwidiI6MX0seyJiIjo3LCJsIjowLjI1LCJt",
    "IjowLCJ2IjoxfSx7ImIiOjksImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MTEsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MTMsImwiOj",
    "AuMjUsIm0iOjAsInYiOjF9LHsiYiI6MTUsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MTcsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6",
    "MTksImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MjEsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MjMsImwiOjAuMjUsIm0iOjAsInYiOj",
    "F9LHsiYiI6MjUsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MjcsImwiOjAuMjUsIm0iOjAsInYiOjF9LHsiYiI6MjksImwiOjAuMjUsIm0i",
    "OjAsInYiOjF9LHsiYiI6MzEsImwiOjAuMjUsIm0iOjAsInYiOjF9XX0seyJpZCI6InQzaDdnIiwibmFtZSI6IkhpLWhhdCIsImluc3QiOiJoYX",
    "QiLCJwYXJhbXMiOnsiZ2FpbiI6MC4xMn0sInZvbCI6MSwicGFuIjowLCJtdXRlIjpmYWxzZSwic29sbyI6ZmFsc2UsImR1Y2tlZCI6ZmFsc2Us",
    "InNjIjpmYWxzZSwibm90ZXMiOlt7ImIiOjAsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjAuNSwibCI6MC4yNSwibS",
    "I6MCwidiI6MC40LCJwYW4iOjAuM30seyJiIjoxLCJsIjowLjI1LCJtIjowLCJ2IjowLjcsInBhbiI6LTAuM30seyJiIjoxLjUsImwiOjAuMjUs",
    "Im0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MiwibCI6MC4yNSwibSI6MCwidiI6MC43LCJwYW4iOi0wLjN9LHsiYiI6Mi41LCJsIjowLj",
    "I1LCJtIjowLCJ2IjowLjQsInBhbiI6MC4zfSx7ImIiOjMsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjMuNSwibCI6",
    "MC4yNSwibSI6MCwidiI6MC40LCJwYW4iOjAuM30seyJiIjozLjUsImwiOjAuMjUsIm0iOjEsInYiOjEsInBhbiI6MC4zfSx7ImIiOjQsImwiOj",
    "AuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjQuNSwibCI6MC4yNSwibSI6MCwidiI6MC40LCJwYW4iOjAuM30seyJiIjo1LCJs",
    "IjowLjI1LCJtIjowLCJ2IjowLjcsInBhbiI6LTAuM30seyJiIjo1LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6Ni",
    "wibCI6MC4yNSwibSI6MCwidiI6MC43LCJwYW4iOi0wLjN9LHsiYiI6Ni41LCJsIjowLjI1LCJtIjowLCJ2IjowLjQsInBhbiI6MC4zfSx7ImIi",
    "OjcsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjcuNSwibCI6MC4yNSwibSI6MCwidiI6MC40LCJwYW4iOjAuM30sey",
    "JiIjo3LjUsImwiOjAuMjUsIm0iOjEsInYiOjEsInBhbiI6MC4zfSx7ImIiOjgsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7",
    "ImIiOjguNSwibCI6MC4yNSwibSI6MCwidiI6MC40LCJwYW4iOjAuM30seyJiIjo5LCJsIjowLjI1LCJtIjowLCJ2IjowLjcsInBhbiI6LTAuM3",
    "0seyJiIjo5LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTAsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjot",
    "MC4zfSx7ImIiOjEwLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTEsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicG",
    "FuIjotMC4zfSx7ImIiOjExLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTEuNSwibCI6MC4yNSwibSI6MSwidiI6",
    "MSwicGFuIjowLjN9LHsiYiI6MTIsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjEyLjUsImwiOjAuMjUsIm0iOjAsIn",
    "YiOjAuNCwicGFuIjowLjN9LHsiYiI6MTMsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjEzLjUsImwiOjAuMjUsIm0i",
    "OjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTQsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE0LjUsImwiOjAuMj",
    "UsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTUsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE1LjUsImwi",
    "OjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MTUuNSwibCI6MC4yNSwibSI6MSwidiI6MSwicGFuIjowLjN9LHsiYiI6MTYsIm",
    "wiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE2LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6",
    "MTcsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE3LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LH",
    "siYiI6MTgsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE4LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjow",
    "LjN9LHsiYiI6MTksImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjE5LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicG",
    "FuIjowLjN9LHsiYiI6MTkuNSwibCI6MC4yNSwibSI6MSwidiI6MSwicGFuIjowLjN9LHsiYiI6MjAsImwiOjAuMjUsIm0iOjAsInYiOjAuNywi",
    "cGFuIjotMC4zfSx7ImIiOjIwLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjEsImwiOjAuMjUsIm0iOjAsInYiOj",
    "AuNywicGFuIjotMC4zfSx7ImIiOjIxLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjIsImwiOjAuMjUsIm0iOjAs",
    "InYiOjAuNywicGFuIjotMC4zfSx7ImIiOjIyLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjMsImwiOjAuMjUsIm",
    "0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjIzLjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjMuNSwibCI6",
    "MC4yNSwibSI6MSwidiI6MSwicGFuIjowLjN9LHsiYiI6MjQsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjI0LjUsIm",
    "wiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjI1",
    "LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjYsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7Im",
    "IiOjI2LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjcsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4z",
    "fSx7ImIiOjI3LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MjcuNSwibCI6MC4yNSwibSI6MSwidiI6MSwicGFuIj",
    "owLjN9LHsiYiI6MjgsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjI4LjUsImwiOjAuMjUsIm0iOjAsInYiOjAuNCwi",
    "cGFuIjowLjN9LHsiYiI6MjksImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjI5LjUsImwiOjAuMjUsIm0iOjAsInYiOj",
    "AuNCwicGFuIjowLjN9LHsiYiI6MzAsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjMwLjUsImwiOjAuMjUsIm0iOjAs",
    "InYiOjAuNCwicGFuIjowLjN9LHsiYiI6MzEsImwiOjAuMjUsIm0iOjAsInYiOjAuNywicGFuIjotMC4zfSx7ImIiOjMxLjUsImwiOjAuMjUsIm",
    "0iOjAsInYiOjAuNCwicGFuIjowLjN9LHsiYiI6MzEuNSwibCI6MC4yNSwibSI6MSwidiI6MSwicGFuIjowLjN9XX0seyJpZCI6InQ0NWV0Iiwi",
    "bmFtZSI6IkJham8iLCJpbnN0Ijoic3ViZmFsbCIsInBhcmFtcyI6eyJnYWluIjowLjQ1LCJkZWNheSI6MC45LCJhdGsiOjQwLCJyZWwiOjMwfS",
    "widm9sIjoxLCJwYW4iOjAsIm11dGUiOmZhbHNlLCJzb2xvIjpmYWxzZSwiZHVja2VkIjp0cnVlLCJzYyI6ZmFsc2UsIm5vdGVzIjpbeyJiIjow",
    "LCJsIjozLjYsIm0iOjM2LCJ2IjoxfSx7ImIiOjQsImwiOjMuNiwibSI6MzMsInYiOjF9LHsiYiI6OCwibCI6My42LCJtIjoyOSwidiI6MX0sey",
    "JiIjoxMiwibCI6My42LCJtIjozMSwidiI6MX0seyJiIjoxNiwibCI6My42LCJtIjozNiwidiI6MX0seyJiIjoyMCwibCI6My42LCJtIjozMywi",
    "diI6MX0seyJiIjoyNCwibCI6My42LCJtIjoyOSwidiI6MX0seyJiIjoyOCwibCI6My42LCJtIjozMSwidiI6MX1dfSx7ImlkIjoidDV5YjAiLC",
    "JuYW1lIjoiQWNvcmRlcyIsImluc3QiOiJzdXBlcnNhdyIsInBhcmFtcyI6eyJnYWluIjowLjEsInciOjAsInZvaWNlcyI6NSwic3ByZWFkIjoy",
    "MCwiYXRrIjowLjAwNCwicmVsIjowLjEyLCJkZWMiOjIuNSwibHAiOjE1MDAsImxwU3dlZXAiOjU1MDAsImxwUmF0ZSI6OX0sInZvbCI6MSwicG",
    "FuIjowLCJtdXRlIjpmYWxzZSwic29sbyI6ZmFsc2UsImR1Y2tlZCI6dHJ1ZSwic2MiOmZhbHNlLCJub3RlcyI6W3siYiI6MCwibCI6MC40LCJt",
    "Ijo3MiwidiI6MSwicGFuIjotMC4zfSx7ImIiOjAsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjowLCJsIjowLjQsIm0iOjc5LC",
    "J2IjoxLCJwYW4iOjB9LHsiYiI6MCwibCI6MC40LCJtIjo4MywidiI6MSwicGFuIjowLjN9LHsiYiI6MS41LCJsIjowLjQsIm0iOjcyLCJ2Ijox",
    "LCJwYW4iOi0wLjN9LHsiYiI6MS41LCJsIjowLjQsIm0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MS41LCJsIjowLjQsIm0iOjc5LCJ2IjoxLC",
    "JwYW4iOjB9LHsiYiI6MS41LCJsIjowLjQsIm0iOjgzLCJ2IjoxLCJwYW4iOjAuM30seyJiIjoyLjUsImwiOjAuNCwibSI6NzIsInYiOjEsInBh",
    "biI6LTAuM30seyJiIjoyLjUsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjoyLjUsImwiOjAuNCwibSI6NzksInYiOjEsInBhbi",
    "I6MH0seyJiIjoyLjUsImwiOjAuNCwibSI6ODMsInYiOjEsInBhbiI6MC4zfSx7ImIiOjMuMjUsImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6",
    "LTAuM30seyJiIjozLjI1LCJsIjowLjQsIm0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6My4yNSwibCI6MC40LCJtIjo3OSwidiI6MSwicGFuIj",
    "owfSx7ImIiOjMuMjUsImwiOjAuNCwibSI6ODMsInYiOjEsInBhbiI6MC4zfSx7ImIiOjQsImwiOjAuNCwibSI6NjksInYiOjEsInBhbiI6LTAu",
    "M30seyJiIjo0LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6NCwibCI6MC40LCJtIjo3NiwidiI6MSwicGFuIjowfSx7Im",
    "IiOjQsImwiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjo1LjUsImwiOjAuNCwibSI6NjksInYiOjEsInBhbiI6LTAuM30seyJiIjo1",
    "LjUsImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6LTAuM30seyJiIjo1LjUsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjo1Lj",
    "UsImwiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjo2LjUsImwiOjAuNCwibSI6NjksInYiOjEsInBhbiI6LTAuM30seyJiIjo2LjUs",
    "ImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6LTAuM30seyJiIjo2LjUsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjo2LjUsIm",
    "wiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjo3LjI1LCJsIjowLjQsIm0iOjY5LCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6Ny4yNSwi",
    "bCI6MC40LCJtIjo3MiwidiI6MSwicGFuIjotMC4zfSx7ImIiOjcuMjUsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjo3LjI1LC",
    "JsIjowLjQsIm0iOjc5LCJ2IjoxLCJwYW4iOjB9LHsiYiI6OCwibCI6MC40LCJtIjo2NSwidiI6MSwicGFuIjowLjN9LHsiYiI6OCwibCI6MC40",
    "LCJtIjo2OSwidiI6MSwicGFuIjotMC4zfSx7ImIiOjgsImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6LTAuM30seyJiIjo4LCJsIjowLjQsIm",
    "0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6OS41LCJsIjowLjQsIm0iOjY1LCJ2IjoxLCJwYW4iOjAuM30seyJiIjo5LjUsImwiOjAuNCwibSI6",
    "NjksInYiOjEsInBhbiI6LTAuM30seyJiIjo5LjUsImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6LTAuM30seyJiIjo5LjUsImwiOjAuNCwibS",
    "I6NzYsInYiOjEsInBhbiI6MH0seyJiIjoxMC41LCJsIjowLjQsIm0iOjY1LCJ2IjoxLCJwYW4iOjAuM30seyJiIjoxMC41LCJsIjowLjQsIm0i",
    "OjY5LCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MTAuNSwibCI6MC40LCJtIjo3MiwidiI6MSwicGFuIjotMC4zfSx7ImIiOjEwLjUsImwiOjAuNC",
    "wibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjoxMS4yNSwibCI6MC40LCJtIjo2NSwidiI6MSwicGFuIjowLjN9LHsiYiI6MTEuMjUsImwiOjAu",
    "NCwibSI6NjksInYiOjEsInBhbiI6LTAuM30seyJiIjoxMS4yNSwibCI6MC40LCJtIjo3MiwidiI6MSwicGFuIjotMC4zfSx7ImIiOjExLjI1LC",
    "JsIjowLjQsIm0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTIsImwiOjAuNCwibSI6NjcsInYiOjEsInBhbiI6MH0seyJiIjoxMiwibCI6MC40",
    "LCJtIjo3MSwidiI6MSwicGFuIjowLjN9LHsiYiI6MTIsImwiOjAuNCwibSI6NzQsInYiOjEsInBhbiI6MC4zfSx7ImIiOjEyLCJsIjowLjQsIm",
    "0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTMuNSwibCI6MC40LCJtIjo2NywidiI6MSwicGFuIjowfSx7ImIiOjEzLjUsImwiOjAuNCwibSI6",
    "NzEsInYiOjEsInBhbiI6MC4zfSx7ImIiOjEzLjUsImwiOjAuNCwibSI6NzQsInYiOjEsInBhbiI6MC4zfSx7ImIiOjEzLjUsImwiOjAuNCwibS",
    "I6NzYsInYiOjEsInBhbiI6MH0seyJiIjoxNC41LCJsIjowLjQsIm0iOjY3LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTQuNSwibCI6MC40LCJtIjo3",
    "MSwidiI6MSwicGFuIjowLjN9LHsiYiI6MTQuNSwibCI6MC40LCJtIjo3NCwidiI6MSwicGFuIjowLjN9LHsiYiI6MTQuNSwibCI6MC40LCJtIj",
    "o3NiwidiI6MSwicGFuIjowfSx7ImIiOjE1LjI1LCJsIjowLjQsIm0iOjY3LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTUuMjUsImwiOjAuNCwibSI6",
    "NzEsInYiOjEsInBhbiI6MC4zfSx7ImIiOjE1LjI1LCJsIjowLjQsIm0iOjc0LCJ2IjoxLCJwYW4iOjAuM30seyJiIjoxNS4yNSwibCI6MC40LC",
    "JtIjo3NiwidiI6MSwicGFuIjowfSx7ImIiOjE2LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MTYsImwiOjAuNCwibSI6",
    "NzYsInYiOjEsInBhbiI6MH0seyJiIjoxNiwibCI6MC40LCJtIjo3OSwidiI6MSwicGFuIjowfSx7ImIiOjE2LCJsIjowLjQsIm0iOjgzLCJ2Ij",
    "oxLCJwYW4iOjAuM30seyJiIjoxNy41LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MTcuNSwibCI6MC40LCJtIjo3Niwi",
    "diI6MSwicGFuIjowfSx7ImIiOjE3LjUsImwiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjoxNy41LCJsIjowLjQsIm0iOjgzLCJ2Ij",
    "oxLCJwYW4iOjAuM30seyJiIjoxOC41LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MTguNSwibCI6MC40LCJtIjo3Niwi",
    "diI6MSwicGFuIjowfSx7ImIiOjE4LjUsImwiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjoxOC41LCJsIjowLjQsIm0iOjgzLCJ2Ij",
    "oxLCJwYW4iOjAuM30seyJiIjoxOS4yNSwibCI6MC40LCJtIjo3MiwidiI6MSwicGFuIjotMC4zfSx7ImIiOjE5LjI1LCJsIjowLjQsIm0iOjc2",
    "LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTkuMjUsImwiOjAuNCwibSI6NzksInYiOjEsInBhbiI6MH0seyJiIjoxOS4yNSwibCI6MC40LCJtIjo4My",
    "widiI6MSwicGFuIjowLjN9LHsiYiI6MjAsImwiOjAuNCwibSI6NjksInYiOjEsInBhbiI6LTAuM30seyJiIjoyMCwibCI6MC40LCJtIjo3Miwi",
    "diI6MSwicGFuIjotMC4zfSx7ImIiOjIwLCJsIjowLjQsIm0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MjAsImwiOjAuNCwibSI6NzksInYiOj",
    "EsInBhbiI6MH0seyJiIjoyMS41LCJsIjowLjQsIm0iOjY5LCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjEuNSwibCI6MC40LCJtIjo3MiwidiI6",
    "MSwicGFuIjotMC4zfSx7ImIiOjIxLjUsImwiOjAuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjoyMS41LCJsIjowLjQsIm0iOjc5LCJ2Ij",
    "oxLCJwYW4iOjB9LHsiYiI6MjIuNSwibCI6MC40LCJtIjo2OSwidiI6MSwicGFuIjotMC4zfSx7ImIiOjIyLjUsImwiOjAuNCwibSI6NzIsInYi",
    "OjEsInBhbiI6LTAuM30seyJiIjoyMi41LCJsIjowLjQsIm0iOjc2LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MjIuNSwibCI6MC40LCJtIjo3OSwidi",
    "I6MSwicGFuIjowfSx7ImIiOjIzLjI1LCJsIjowLjQsIm0iOjY5LCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjMuMjUsImwiOjAuNCwibSI6NzIs",
    "InYiOjEsInBhbiI6LTAuM30seyJiIjoyMy4yNSwibCI6MC40LCJtIjo3NiwidiI6MSwicGFuIjowfSx7ImIiOjIzLjI1LCJsIjowLjQsIm0iOj",
    "c5LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MjQsImwiOjAuNCwibSI6NjUsInYiOjEsInBhbiI6MC4zfSx7ImIiOjI0LCJsIjowLjQsIm0iOjY5LCJ2",
    "IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjQsImwiOjAuNCwibSI6NzIsInYiOjEsInBhbiI6LTAuM30seyJiIjoyNCwibCI6MC40LCJtIjo3Niwidi",
    "I6MSwicGFuIjowfSx7ImIiOjI1LjUsImwiOjAuNCwibSI6NjUsInYiOjEsInBhbiI6MC4zfSx7ImIiOjI1LjUsImwiOjAuNCwibSI6NjksInYi",
    "OjEsInBhbiI6LTAuM30seyJiIjoyNS41LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjUuNSwibCI6MC40LCJtIjo3Ni",
    "widiI6MSwicGFuIjowfSx7ImIiOjI2LjUsImwiOjAuNCwibSI6NjUsInYiOjEsInBhbiI6MC4zfSx7ImIiOjI2LjUsImwiOjAuNCwibSI6Njks",
    "InYiOjEsInBhbiI6LTAuM30seyJiIjoyNi41LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjYuNSwibCI6MC40LCJtIj",
    "o3NiwidiI6MSwicGFuIjowfSx7ImIiOjI3LjI1LCJsIjowLjQsIm0iOjY1LCJ2IjoxLCJwYW4iOjAuM30seyJiIjoyNy4yNSwibCI6MC40LCJt",
    "Ijo2OSwidiI6MSwicGFuIjotMC4zfSx7ImIiOjI3LjI1LCJsIjowLjQsIm0iOjcyLCJ2IjoxLCJwYW4iOi0wLjN9LHsiYiI6MjcuMjUsImwiOj",
    "AuNCwibSI6NzYsInYiOjEsInBhbiI6MH0seyJiIjoyOCwibCI6MC40LCJtIjo2NywidiI6MSwicGFuIjowfSx7ImIiOjI4LCJsIjowLjQsIm0i",
    "OjcxLCJ2IjoxLCJwYW4iOjAuM30seyJiIjoyOCwibCI6MC40LCJtIjo3NCwidiI6MSwicGFuIjowLjN9LHsiYiI6MjgsImwiOjAuNCwibSI6Nz",
    "YsInYiOjEsInBhbiI6MH0seyJiIjoyOS41LCJsIjowLjQsIm0iOjY3LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MjkuNSwibCI6MC40LCJtIjo3MSwi",
    "diI6MSwicGFuIjowLjN9LHsiYiI6MjkuNSwibCI6MC40LCJtIjo3NCwidiI6MSwicGFuIjowLjN9LHsiYiI6MjkuNSwibCI6MC40LCJtIjo3Ni",
    "widiI6MSwicGFuIjowfSx7ImIiOjMwLjUsImwiOjAuNCwibSI6NjcsInYiOjEsInBhbiI6MH0seyJiIjozMC41LCJsIjowLjQsIm0iOjcxLCJ2",
    "IjoxLCJwYW4iOjAuM30seyJiIjozMC41LCJsIjowLjQsIm0iOjc0LCJ2IjoxLCJwYW4iOjAuM30seyJiIjozMC41LCJsIjowLjQsIm0iOjc2LC",
    "J2IjoxLCJwYW4iOjB9LHsiYiI6MzEuMjUsImwiOjAuNCwibSI6NjcsInYiOjEsInBhbiI6MH0seyJiIjozMS4yNSwibCI6MC40LCJtIjo3MSwi",
    "diI6MSwicGFuIjowLjN9LHsiYiI6MzEuMjUsImwiOjAuNCwibSI6NzQsInYiOjEsInBhbiI6MC4zfSx7ImIiOjMxLjI1LCJsIjowLjQsIm0iOj",
    "c2LCJ2IjoxLCJwYW4iOjB9XSwiZngiOnsicmV2ZXJiIjp7Im9uIjp0cnVlLCJzaXplIjowLjY1LCJkYW1wIjowLjUsIm1peCI6MC4zLCJwcmUi",
    "OjEyfX19LHsiaWQiOiJ0NmFzNiIsIm5hbWUiOiJQYWQgYWlyZWFkbyIsImluc3QiOiJwYWQiLCJwYXJhbXMiOnsiZ2FpbiI6MC4wOCwidyI6MC",
    "widm9pY2VzIjoyLCJzcHJlYWQiOjksImF0ayI6MC41LCJyZWwiOjAuNSwiZGVjIjowLCJscCI6MjYwMCwibHBTd2VlcCI6MCwibHBSYXRlIjox",
    "MH0sInZvbCI6MSwicGFuIjowLCJtdXRlIjpmYWxzZSwic29sbyI6ZmFsc2UsImR1Y2tlZCI6dHJ1ZSwic2MiOmZhbHNlLCJub3RlcyI6W3siYi",
    "I6MCwibCI6NCwibSI6NjAsInYiOjEsInBhbiI6LTAuMzZ9LHsiYiI6MCwibCI6NCwibSI6NjQsInYiOjEsInBhbiI6MC4zNn0seyJiIjowLCJs",
    "Ijo0LCJtIjo2NywidiI6MSwicGFuIjowfSx7ImIiOjAsImwiOjQsIm0iOjcxLCJ2IjoxLCJwYW4iOi0wLjE4fSx7ImIiOjQsImwiOjQsIm0iOj",
    "U3LCJ2IjoxLCJwYW4iOjB9LHsiYiI6NCwibCI6NCwibSI6NjAsInYiOjEsInBhbiI6LTAuMzZ9LHsiYiI6NCwibCI6NCwibSI6NjQsInYiOjEs",
    "InBhbiI6MC4zNn0seyJiIjo0LCJsIjo0LCJtIjo2NywidiI6MSwicGFuIjowfSx7ImIiOjgsImwiOjQsIm0iOjUzLCJ2IjoxLCJwYW4iOjAuMT",
    "h9LHsiYiI6OCwibCI6NCwibSI6NTcsInYiOjEsInBhbiI6MH0seyJiIjo4LCJsIjo0LCJtIjo2MCwidiI6MSwicGFuIjotMC4zNn0seyJiIjo4",
    "LCJsIjo0LCJtIjo2NCwidiI6MSwicGFuIjowLjM2fSx7ImIiOjEyLCJsIjo0LCJtIjo1NSwidiI6MSwicGFuIjotMC4zNn0seyJiIjoxMiwibC",
    "I6NCwibSI6NTksInYiOjEsInBhbiI6MC4zNn0seyJiIjoxMiwibCI6NCwibSI6NjIsInYiOjEsInBhbiI6MH0seyJiIjoxMiwibCI6NCwibSI6",
    "NjQsInYiOjEsInBhbiI6MC4zNn0seyJiIjoxNiwibCI6NCwibSI6NjAsInYiOjEsInBhbiI6LTAuMzZ9LHsiYiI6MTYsImwiOjQsIm0iOjY0LC",
    "J2IjoxLCJwYW4iOjAuMzZ9LHsiYiI6MTYsImwiOjQsIm0iOjY3LCJ2IjoxLCJwYW4iOjB9LHsiYiI6MTYsImwiOjQsIm0iOjcxLCJ2IjoxLCJw",
    "YW4iOi0wLjE4fSx7ImIiOjIwLCJsIjo0LCJtIjo1NywidiI6MSwicGFuIjowfSx7ImIiOjIwLCJsIjo0LCJtIjo2MCwidiI6MSwicGFuIjotMC",
    "4zNn0seyJiIjoyMCwibCI6NCwibSI6NjQsInYiOjEsInBhbiI6MC4zNn0seyJiIjoyMCwibCI6NCwibSI6NjcsInYiOjEsInBhbiI6MH0seyJi",
    "IjoyNCwibCI6NCwibSI6NTMsInYiOjEsInBhbiI6MC4xOH0seyJiIjoyNCwibCI6NCwibSI6NTcsInYiOjEsInBhbiI6MH0seyJiIjoyNCwibC",
    "I6NCwibSI6NjAsInYiOjEsInBhbiI6LTAuMzZ9LHsiYiI6MjQsImwiOjQsIm0iOjY0LCJ2IjoxLCJwYW4iOjAuMzZ9LHsiYiI6MjgsImwiOjQs",
    "Im0iOjU1LCJ2IjoxLCJwYW4iOi0wLjM2fSx7ImIiOjI4LCJsIjo0LCJtIjo1OSwidiI6MSwicGFuIjowLjM2fSx7ImIiOjI4LCJsIjo0LCJtIj",
    "o2MiwidiI6MSwicGFuIjowfSx7ImIiOjI4LCJsIjo0LCJtIjo2NCwidiI6MSwicGFuIjowLjM2fV0sImF1dG8iOnsidm9sIjpbeyJiIjowLCJ2",
    "IjoxfSx7ImIiOjE2LCJ2IjowLjN9XX19LHsiaWQiOiJ0NzE2ZCIsIm5hbWUiOiJQbHVjayIsImluc3QiOiJwbHVjayIsInBhcmFtcyI6eyJnYW",
    "luIjowLjEsInciOjAsInZvaWNlcyI6Miwic3ByZWFkIjo2LCJhdGsiOjAuMDAzLCJyZWwiOjAuMDUsImRlYyI6NiwibHAiOjkwMCwibHBTd2Vl",
    "cCI6NDUwMCwibHBSYXRlIjoxNH0sInZvbCI6MSwicGFuIjowLCJtdXRlIjpmYWxzZSwic29sbyI6ZmFsc2UsImR1Y2tlZCI6dHJ1ZSwic2MiOm",
    "ZhbHNlLCJub3RlcyI6W3siYiI6MTYsImwiOjAuNDIsIm0iOjk1LCJ2IjoxLCJwYW4iOi0wLjR9LHsiYiI6MTcsImwiOjAuNDIsIm0iOjg4LCJ2",
    "IjoxLCJwYW4iOi0wLjR9LHsiYiI6MTcuNSwibCI6MC40MiwibSI6OTEsInYiOjEsInBhbiI6MC40fSx7ImIiOjE4LjUsImwiOjAuNDIsIm0iOj",
    "g4LCJ2IjoxLCJwYW4iOjAuNH0seyJiIjoxOSwibCI6MC40MiwibSI6OTEsInYiOjEsInBhbiI6LTAuNH0seyJiIjoyMCwibCI6MC40MiwibSI6",
    "OTEsInYiOjEsInBhbiI6LTAuNH0seyJiIjoyMSwibCI6MC40MiwibSI6ODgsInYiOjEsInBhbiI6LTAuNH0seyJiIjoyMiwibCI6MC40MiwibS",
    "I6OTEsInYiOjEsInBhbiI6LTAuNH0seyJiIjoyMi41LCJsIjowLjQyLCJtIjo4OCwidiI6MSwicGFuIjowLjR9LHsiYiI6MjMuNSwibCI6MC40",
    "MiwibSI6ODgsInYiOjEsInBhbiI6MC40fSx7ImIiOjI0LCJsIjowLjQyLCJtIjo4OCwidiI6MSwicGFuIjotMC40fSx7ImIiOjI1LCJsIjowLj",
    "QyLCJtIjo4MSwidiI6MSwicGFuIjotMC40fSx7ImIiOjI1LjUsImwiOjAuNDIsIm0iOjg0LCJ2IjoxLCJwYW4iOjAuNH0seyJiIjoyNi41LCJs",
    "IjowLjQyLCJtIjo4MSwidiI6MSwicGFuIjowLjR9LHsiYiI6MjcsImwiOjAuNDIsIm0iOjg0LCJ2IjoxLCJwYW4iOi0wLjR9LHsiYiI6MjgsIm",
    "wiOjAuNDIsIm0iOjg4LCJ2IjoxLCJwYW4iOi0wLjR9LHsiYiI6MjksImwiOjAuNDIsIm0iOjg2LCJ2IjoxLCJwYW4iOi0wLjR9LHsiYiI6MzAs",
    "ImwiOjAuNDIsIm0iOjg4LCJ2IjoxLCJwYW4iOi0wLjR9LHsiYiI6MzAuNSwibCI6MC40MiwibSI6ODYsInYiOjEsInBhbiI6MC40fSx7ImIiOj",
    "MxLjUsImwiOjAuNDIsIm0iOjg2LCJ2IjoxLCJwYW4iOjAuNH1dfV0sImNsaXBzIjp7fSwicGx1Z2lucyI6W119"
  ].join('');
  // ═══ motor de Demo Kit (incrustado) ═══
// ═══════════════════════════════════════════════════════════════════════
//  MOTOR DEL ESTUDIO (sin DOM): instrumentos, render, conversión de demos, proyectos
// ═══════════════════════════════════════════════════════════════════════
let SR=44100, TAIL=2.5, KIT_SEED=20261015;
const Kit={make:(typeof demoKit==='function')?demoKit:null};   // se puede reemplazar cargando otro demo_kit.js
const tick=()=>new Promise(r=>setTimeout(r,0));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));              // las demos lo usan
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const r6=x=>Math.round(x*1e6)/1e6;
let _rev=0;
function hash2(str){ let a=0x811c9dc5,b=5381; for(let i=0;i<str.length;i++){ const c=str.charCodeAt(i); a^=c; a=Math.imul(a,16777619); b=(Math.imul(b,33)^c)|0; } return (a>>>0).toString(36)+'-'+(b>>>0).toString(36); }
let _uid=0; const uid=()=>'t'+(++_uid).toString(36)+Math.random().toString(36).slice(2,5);
const satf=x=>x/(1+Math.abs(x));

// ───────────────────────── registro de instrumentos ─────────────────────────
const INSTRUMENTS={}, INST_ORDER=[];
let USER_PLUGINS=[];                                            // [{id,name,code}]
const slug=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'inst';
function registerInstrument(def,opts){
  if(!def||typeof def.play!=='function') throw new Error('El instrumento necesita una función play(K, n)');
  def.name=def.name||'Sin nombre'; def.id=def.id||slug(def.name); def.kind=def.kind==='perc'?'perc':'melodic';
  def.params=(def.params||[]).map(p=>Object.assign({type:'num',min:0,max:1,step:.01,def:0,label:p.k},p));
  if(def.kind==='perc'&&!def.lanes) def.lanes=[{name:def.name}];
  def.user=!!(opts&&opts.user); def.rev=++_rev;
  if(!INSTRUMENTS[def.id]) INST_ORDER.push(def.id);
  INSTRUMENTS[def.id]=def; return def;
}
const defaultParams=inst=>{const p={};for(const d of inst.params)p[d.k]=d.def;return p;};

// ayudas de síntesis
const _fn=new Map();
function fnFromSrc(src){ if(!_fn.has(src)){ let f=null; try{ f=new Function('"use strict";return ('+src+')')(); }catch(e){} _fn.set(src,f);} return _fn.get(src); }
function lpFor(p){
  if(p.lpSrc){ const f=fnFromSrc(p.lpSrc); if(f) return f; }
  if(p.lpSweep>0){ const b=p.lp,s=p.lpSweep,r=p.lpRate; return t=>b+s*Math.exp(-t*r); }
  return p.lp;
}
function detFor(p){
  if(Array.isArray(p.detRaw)&&p.detRaw.length) return p.detRaw;
  const V=Math.max(1,Math.round(p.voices)),S=p.spread; if(V===1) return [0];
  const a=[]; for(let i=0;i<V;i++) a.push(-S+2*S*i/(V-1)); return a;
}
const G=def=>({k:'gain',label:'Ganancia',min:0,max:1.5,step:.005,def});

function synthParams(d){return [G(d.gain),
  {k:'w',label:'Onda',type:'choice',opts:['Sierra','Cuadrada','Seno'],vals:[0,1,2],def:d.w},
  {k:'voices',label:'Voces',min:1,max:9,step:1,def:d.voices},
  {k:'spread',label:'Desafine (cents)',min:0,max:50,step:.5,def:d.spread},
  {k:'atk',label:'Ataque (s)',min:.001,max:2,step:.001,def:d.atk},
  {k:'rel',label:'Release (s)',min:.01,max:2,step:.01,def:d.rel},
  {k:'dec',label:'Caída (1/s)',min:0,max:20,step:.1,def:d.dec},
  {k:'lp',label:'Filtro base (Hz)',min:60,max:12000,step:10,def:d.lp},
  {k:'lpSweep',label:'Filtro: barrido (Hz)',min:0,max:9000,step:10,def:d.lpSweep},
  {k:'lpRate',label:'Filtro: velocidad (1/s)',min:.5,max:40,step:.5,def:d.lpRate}];}
function synthDef(id,name,desc,d){
  return {id,name,desc,kind:'melodic',params:synthParams(d),
    play(K,n){const p=n.p; K.syn(n.buf,n.t,n.len,n.hz,n.a*p.gain,n.pan,{det:detFor(p),atk:p.atk,rel:p.rel,w:p.w,dec:p.dec,lp:lpFor(p)});}};
}
const S0={gain:.2,w:0,voices:3,spread:10,atk:.004,rel:.08,dec:0,lp:3000,lpSweep:0,lpRate:10};
registerInstrument(synthDef('sinte','Sinte (genérico)','K.syn con todos sus controles: onda, voces desafinadas, envolvente y filtro que se cierra.',S0));
registerInstrument(synthDef('supersaw','Supersaw','Acordes anchos del future bass: 5 sierras desafinadas y filtro que se cierra rápido.',Object.assign({},S0,{gain:.1,voices:5,spread:20,rel:.12,dec:2.5,lp:1500,lpSweep:5500,lpRate:9})));
registerInstrument(synthDef('pluck','Pluck / arpegio','Nota corta y brillante con caída de filtro.',Object.assign({},S0,{gain:.1,voices:2,spread:6,atk:.003,rel:.05,dec:6,lp:900,lpSweep:4500,lpRate:14})));
registerInstrument(synthDef('arp','Arpegio cuadrado','Onda cuadrada con filtro que se cierra: el arpegio oscuro de The Void.',Object.assign({},S0,{gain:.09,w:1,voices:2,spread:8,atk:.003,rel:.05,dec:7,lp:700,lpSweep:3200,lpRate:13})));
registerInstrument(synthDef('pad','Pad aireado','Sierras lentas con ataque y release largos.',Object.assign({},S0,{gain:.08,voices:2,spread:9,atk:.5,rel:.5,dec:0,lp:2600})));
registerInstrument(synthDef('sub','Sub (seno)','Seno puro para graves.',Object.assign({},S0,{gain:.42,w:2,voices:1,spread:0,atk:.01,rel:.08,dec:1.2,lp:900})));

registerInstrument({id:'subfall',name:'Sub con caída',kind:'melodic',desc:'Seno con caída exponencial y cierre rápido (el sub del drop de The Void).',
  params:[G(.45),{k:'decay',label:'Caída (1/s)',min:0,max:4,step:.05,def:.9},{k:'atk',label:'Ataque (1/s)',min:5,max:200,step:1,def:40},{k:'rel',label:'Cierre (1/s)',min:5,max:200,step:1,def:30}],
  play(K,n){const p=n.p,f=n.hz,L=n.len; K.add(n.buf,n.t,L,t=>Math.sin(2*Math.PI*f*t)*Math.min(1,t*p.atk)*(p.decay>0?Math.exp(-t*p.decay):1)*Math.min(1,(L-t)*p.rel),n.a*p.gain,n.pan);}});

registerInstrument({id:'reese',name:'Reese (bajo gruñón)',kind:'melodic',desc:'Tres sierras desafinadas → filtro de 2 polos que respira → saturación (portado de The Void).',
  params:[G(.42),{k:'lfoB',label:'Respiración (ciclos/pulso)',min:0,max:8,step:.25,def:.5},{k:'lo',label:'Filtro mínimo (Hz)',min:80,max:2000,step:10,def:260},{k:'hi',label:'Filtro máximo (Hz)',min:200,max:6000,step:10,def:1400},{k:'drive',label:'Saturación',min:.5,max:8,step:.1,def:2.2}],
  play(K,n){
    const p=n.p,sr=n.sr,f=n.hz,cents=[-17,0,17],inc=cents.map(c=>f*Math.pow(2,c/1200)/sr),ph=cents.map(()=>K.rnd()*.5+.5);
    const lfo=p.lfoB/n.beat,lo=p.lo,hi=p.hi,drive=p.drive,L=n.len+.05; let y1=0,y2=0;
    K.add(n.buf,n.t,L,t=>{ let s=0;
      for(let k=0;k<3;k++){ ph[k]+=inc[k]*(1+.002*Math.sin(t*2.1+k)); ph[k]-=Math.floor(ph[k]); s+=2*ph[k]-1; }
      const c=K.lpc(lo+(hi-lo)*(.5+.5*Math.sin(6.2831853*lfo*t))); y1+=c*(s/3-y1); y2+=c*(y1-y2);
      return satf(y2*drive)*Math.min(1,t/.01)*Math.min(1,(L-t)/.05)*1.2; },n.a*p.gain,n.pan);
  }});
registerInstrument({id:'growl',name:'Growl (wob dubstep)',kind:'melodic',desc:'FM con índice modulado por un LFO al ritmo → saturación → filtro que respira (portado de The Void).',
  params:[G(.18),{k:'rateB',label:'Wob (ciclos/pulso)',min:.5,max:8,step:.25,def:2}],
  play(K,n){
    const p=n.p,sr=n.sr,f=n.hz,rate=p.rateB/n.beat,L=n.len+.04; let pc=0,pm=0,y=0;
    K.add(n.buf,n.t,L,t=>{ pc+=f/sr; pm+=f*2.01/sr; pc-=Math.floor(pc); pm-=Math.floor(pm);
      const lf=.5+.5*Math.sin(6.2831853*rate*t), x=satf(2.5*Math.sin(6.2831853*pc+(1.5+6*lf)*Math.sin(6.2831853*pm)));
      y+=K.lpc(500+3000*lf)*(x-y);
      return y*Math.min(1,t/.008)*Math.min(1,(L-t)/.04)*1.3; },n.a*p.gain,n.pan);
  }});
registerInstrument({id:'bell',name:'Campana / cajita de música',kind:'melodic',buf:'mu',desc:'K.bell: parciales inarmónicos que decaen a distinta velocidad.',
  params:[G(.1),{k:'len',label:'Duración (s)',min:.3,max:6,step:.05,def:1.4}],
  play(K,n){K.bell(n.t,n.midi,n.a*n.p.gain,n.pan,n.p.len);}});
registerInstrument({id:'chop',name:'Sílaba cantada (chop)',kind:'melodic',buf:'mu',desc:'K.chop: sierra filtrada por dos resonadores (formantes de la vocal).',
  params:[G(.14),{k:'v',label:'Vocal',type:'choice',opts:['oh','ah','ee','oo'],vals:['oh','ah','ee','oo'],def:'oh'}],
  play(K,n){K.chop(n.t,n.len,n.midi,n.a*n.p.gain,n.pan,n.p.v);}});

// percusión y efectos de un solo carril
registerInstrument({id:'riser',name:'Riser (ruido ascendente)',kind:'perc',buf:'mu',desc:'K.riser: ruido filtrado que sube durante toda la nota.',params:[G(.45)],
  play(K,n){K.riser(n.t,n.len,n.a*n.p.gain);}});
registerInstrument({id:'sweep',name:'Barrido (seno)',kind:'perc',buf:'mu',desc:'K.sweep: seno que sube de f0 a f1 durante la nota.',
  params:[G(.07),{k:'f0',label:'Frecuencia inicial (Hz)',min:40,max:2000,step:5,def:300},{k:'f1',label:'Frecuencia final (Hz)',min:200,max:8000,step:10,def:2400}],
  play(K,n){K.sweep(n.t,n.len,n.p.f0,n.p.f1,n.a*n.p.gain);}});
registerInstrument({id:'wash',name:'Viento (ruido)',kind:'perc',desc:'Ruido filtrado con entrada y salida suaves (textura de fondo).',
  params:[G(.05),{k:'fc',label:'Corte (Hz)',min:200,max:8000,step:50,def:1500}],
  play(K,n){const p=n.p; let y=0; K.add(n.buf,n.t,n.len,t=>{ y+=K.lpc(p.fc)*(K.rnd()-y); return y*Math.min(1,t/.8)*Math.min(1,(n.len-t)/.8); },n.a*p.gain,n.pan);}});
registerInstrument({id:'impact',name:'Impacto (sub que cae)',kind:'perc',oneShot:true,desc:'Seno grave que cae de frecuencia; para marcar cambios de sección.',params:[G(.55)],
  play(K,n){K.add(n.buf,n.t,1.1,t=>Math.sin(2*Math.PI*(35*t+(85/3)*(1-Math.exp(-3*t))))*Math.exp(-t*2.6),n.a*n.p.gain,n.pan);}});
registerInstrument({id:'rim',name:'Rim (clic seco)',kind:'perc',oneShot:true,ducked:false,desc:'Tono corto + ruido seco; sincopa extra.',params:[G(.16)],
  play(K,n){let z=0; K.add(n.buf,n.t,.1,t=>{ const x=K.rnd(),v=x-z*.5; z=x; return Math.sin(2*Math.PI*880*t)*Math.exp(-t*70)+v*Math.exp(-t*90)*.6; },n.a*n.p.gain,n.pan);}});

// batería del kit
registerInstrument({id:'kick',name:'Bombo',kind:'perc',oneShot:true,buf:'dr',desc:'K.kick: seno que cae de hi a lo + clic.',
  params:[G(1),{k:'lo',label:'Grave final (Hz)',min:30,max:90,step:1,def:50},{k:'hi',label:'Ataque (Hz)',min:80,max:260,step:1,def:140},{k:'k',label:'Rapidez de caída',min:10,max:80,step:1,def:35},{k:'dec',label:'Decaimiento (1/s)',min:2,max:20,step:.1,def:8},{k:'len',label:'Duración (s)',min:.1,max:1,step:.01,def:.4},{k:'click',label:'Clic',min:0,max:1,step:.01,def:.3}],
  play(K,n){const p=n.p; K.kick(n.t,n.a*p.gain,{lo:p.lo,hi:p.hi,k:p.k,dec:p.dec,len:p.len,click:p.click});}});
registerInstrument({id:'snare',name:'Caja',kind:'perc',oneShot:true,buf:'dr',desc:'K.snare: ruido + tono.',
  params:[G(.85),{k:'tone',label:'Tono (Hz)',min:100,max:400,step:1,def:200},{k:'nd',label:'Caída ruido (1/s)',min:5,max:50,step:.5,def:18},{k:'td',label:'Caída tono (1/s)',min:5,max:80,step:.5,def:26},{k:'len',label:'Duración (s)',min:.08,max:.6,step:.01,def:.25}],
  play(K,n){const p=n.p; K.snare(n.t,n.a*p.gain,{tone:p.tone,nd:p.nd,td:p.td,len:p.len});}});
registerInstrument({id:'clap',name:'Palma',kind:'perc',oneShot:true,buf:'dr',desc:'K.clap: ráfagas de ruido.',params:[G(.5)],play(K,n){K.clap(n.t,n.a*n.p.gain);}});
registerInstrument({id:'snap',name:'Chasquido',kind:'perc',oneShot:true,buf:'dr',desc:'K.snap: chasquido de dedos.',params:[G(.2)],play(K,n){K.snap(n.t,n.a*n.p.gain,n.pan);}});
registerInstrument({id:'hat',name:'Hi-hat',kind:'perc',oneShot:true,buf:'dr',lanes:[{name:'Cerrado'},{name:'Abierto'}],desc:'K.hat: carril 1 cerrado, carril 2 abierto.',params:[G(.1)],
  play(K,n){K.hat(n.t,n.a*n.p.gain,Math.round(n.lane)===1,n.pan);}});
registerInstrument({id:'crash',name:'Crash',kind:'perc',oneShot:true,buf:'dr',desc:'K.crash: platillo de ruido.',params:[G(.3),{k:'len',label:'Duración (s)',min:.5,max:5,step:.1,def:2.4}],
  play(K,n){K.crash(n.t,n.a*n.p.gain,n.p.len);}});
registerInstrument({id:'clip',name:'Clip de audio horneado',kind:'perc',oneShot:true,hidden:true,desc:'Audio fijo capturado de una demo (un add() con función interna que no se puede parametrizar).',params:[G(1)],
  play(K,n){const d=n.clips&&n.clips[n.note.o&&n.note.o.cid]; if(!d) return; const sr=n.sr; K.add(n.buf,n.t,d.length/sr,t=>d[Math.round(t*sr)]||0,n.a*n.p.gain,n.pan);}});

// ───────────────────────── plugins de usuario ─────────────────────────
function evalPlugin(code){
  let def=null; const reg=d=>{def=d;return d;};
  try{ const f=new Function('registerInstrument',code); const ret=f(reg); if(!def&&ret&&typeof ret==='object') def=ret; }
  catch(e){ if(e instanceof SyntaxError){ let ok=false; try{ const r=new Function('return ('+code+')')(); if(r&&typeof r==='object'){def=r;ok=true;} }catch(e2){} if(!ok) throw e; } else throw e; }
  if(!def) throw new Error('El código no registró ningún instrumento: usa registerInstrument({ … })');
  return def;
}
function persistPlugins(){ try{ if(typeof localStorage!=='undefined') localStorage.setItem('demokit-studio-plugins',JSON.stringify(USER_PLUGINS)); }catch(e){} }
function installPlugin(code){
  const def=evalPlugin(code); registerInstrument(def,{user:true});
  const rec={id:def.id,name:def.name,code}; const i=USER_PLUGINS.findIndex(u=>u.id===def.id);
  if(i>=0) USER_PLUGINS[i]=rec; else USER_PLUGINS.push(rec); persistPlugins(); return def;
}
function removePlugin(id){ USER_PLUGINS=USER_PLUGINS.filter(u=>u.id!==id); persistPlugins(); }

// ───────────────────────── proyecto ─────────────────────────
function newProject(name,bpm,bars){return {name:name||'Sin título',bpm:bpm||120,bars:bars||8,seed:KIT_SEED,sc:{mode:'param',depth:.7,rel:.12,table:null,rate:800},master:Object.assign({},MASTER_DEF),tracks:[],clips:{}};}
function newTrack(instId,name){
  const inst=INSTRUMENTS[instId];
  return {id:uid(),name:name||inst.name,inst:instId,params:defaultParams(inst),vol:1,pan:0,mute:false,solo:false,
    ducked:inst.buf==='mu'?true:inst.buf==='dr'?false:inst.ducked!==false,sc:instId==='kick',notes:[]};
}
function fixTrack(t){ if(!t.id) t.id=uid(); const inst=INSTRUMENTS[t.inst]; if(inst) t.params=Object.assign(defaultParams(inst),t.params||{}); t.notes=t.notes||[]; t.vol=t.vol==null?1:t.vol; t.pan=t.pan||0; return t; }

function starterProject(){
  const P=newProject('Ejemplo',128,8); P.sc.depth=.7; P.sc.rel=.14;
  const T=id=>{const t=newTrack(id);P.tracks.push(t);return t;};
  const kick=T('kick'), clap=T('clap'), hat=T('hat'), sub=T('subfall'), chords=T('supersaw'), pad=T('pad'), pl=T('pluck');
  hat.params.gain=.12; sub.name='Bajo'; chords.name='Acordes'; pl.name='Pluck';
  const CH=[{r:36,t:[60,64,67,71]},{r:33,t:[57,60,64,67]},{r:29,t:[53,57,60,64]},{r:31,t:[55,59,62,64]}];
  for(let b=0;b<8;b++){
    const c=CH[b%4], o=b*4;
    for(let k=0;k<4;k++) kick.notes.push({b:o+k,l:.25,m:0,v:1});
    for(const k of [1,3]) clap.notes.push({b:o+k,l:.25,m:0,v:1});
    for(let i=0;i<8;i++) hat.notes.push({b:o+i*.5,l:.25,m:0,v:i%2?.4:.7,pan:i%2?.3:-.3});
    hat.notes.push({b:o+3.5,l:.25,m:1,v:1,pan:.3});
    sub.notes.push({b:o,l:3.6,m:c.r,v:1});
    for(const p of [0,1.5,2.5,3.25]) for(const m of c.t) chords.notes.push({b:o+p,l:.4,m:m+12,v:1,pan:r6(((m%3)-1)*.3)});
    for(const m of c.t) pad.notes.push({b:o,l:4,m,v:1,pan:r6(((m%5)-2)*.18)});
    if(b>=4){ const pat=(b%2)?[3,-1,2,-1,3,2,-1,2]:[3,-1,1,2,-1,1,2,-1]; pat.forEach((x,i)=>{ if(x>=0) pl.notes.push({b:o+i*.5,l:.42,m:c.t[x]+24,v:1,pan:i%2?.4:-.4}); }); }
  }
  return P;
}

// ───────────────────────── render ─────────────────────────
function noteArgs(K,P,tr,nt,beat,t0){
  const p=nt.o?Object.assign({},tr.params,nt.o):tr.params;
  return {t:t0!=null?t0:nt.b*beat,len:Math.max(.01,(nt.l||.25)*beat),midi:nt.m,hz:K.hz(nt.m),lane:nt.m,a:(nt.v==null?1:nt.v)*(tr.vol==null?1:tr.vol),
    pan:clamp((tr.pan||0)+(nt.pan||0),-1,1),p,buf:tr.ducked?K.mu:K.dr,sr:SR,bpm:P.bpm,beat,bar:beat*4,note:nt,clips:P.clips};
}
function makeDuck(P,beat){
  const sc=P.sc||{};
  if(sc.mode==='table'&&sc.table){ const T=sc.table,R=sc.rate||800; return t=>{ const x=t*R,i=Math.floor(x); if(i>=T.length-1) return T[T.length-1]; if(i<0) return T[0]; const f=x-i; return T[i]+(T[i+1]-T[i])*f; }; }
  const tr=[]; for(const t of P.tracks) if(t.sc) for(const n of t.notes) tr.push(n.b*beat); tr.sort((a,b)=>a-b);
  if(!tr.length||!(sc.depth>0)) return ()=>1;
  const depth=sc.depth,rel=Math.max(.005,sc.rel||.1); let idx=0;
  return t=>{ while(idx+1<tr.length&&tr[idx+1]<=t) idx++; while(idx>0&&tr[idx]>t) idx--; if(tr[idx]>t) return 1; return 1-depth*Math.exp(-(t-tr[idx])/rel); };
}
// ───────────────────────── efectos: delay, reverb (por pista) y master (EQ + limitador) ─────────────────────────
// Trabajan sobre el audio ya renderizado, así que cambiar un efecto no vuelve a renderizar el instrumento.
const FX_DEF={delay:{on:false,time:.75,fb:.4,tone:4500,mix:.3,pp:true},reverb:{on:false,size:.65,damp:.5,mix:.25,pre:12}};
const MASTER_DEF={low:0,high:0,gain:1,limit:true,ceil:.97};
const fxOf=tr=>{ const f=(tr&&tr.fx)||{}; return {delay:Object.assign({},FX_DEF.delay,f.delay),reverb:Object.assign({},FX_DEF.reverb,f.reverb)}; };
const fxActive=fx=>!!((fx.delay.on&&fx.delay.mix>0)||(fx.reverb.on&&fx.reverb.mix>0));
const masterOf=P=>Object.assign({},MASTER_DEF,P.master);
const REV_WET=.74;      // calibración de la reverb (ver pruebas): con mezcla = 1 el nivel del agua ≈ nivel de la entrada
const revFbk=size=>.7+.26*clamp(size,0,1);                                    // máx .96 → cola de unos 5 s
const revComp=size=>{ const f=revFbk(size),r=revFbk(.65); return Math.sqrt((1-f*f)/(1-r*r)); };   // mantiene el volumen parecido al cambiar el tamaño
function delayFx(L,R,m,p,beat){
  const d=Math.max(1,Math.round(p.time*beat*SR)), fb=clamp(p.fb,0,.92), a=1-Math.exp(-2*Math.PI*clamp(p.tone,200,16000)/SR), mix=clamp(p.mix,0,1), nL=L.length;
  const oL=new Float32Array(m),oR=new Float32Array(m),wL=new Float32Array(m),wR=new Float32Array(m); oL.set(L.subarray(0,Math.min(nL,m))); oR.set(R.subarray(0,Math.min(nL,m))); let yl=0,yr=0;
  for(let i=d;i<m;i++){ const j=i-d, xl=j<nL?L[j]:0, xr=j<nL?R[j]:0; let vl,vr;
    if(p.pp){ vl=.5*(xl+xr)+fb*wR[j]; vr=fb*wL[j]; } else { vl=xl+fb*wL[j]; vr=xr+fb*wR[j]; }      // ping-pong: el eco rebota entre izquierda y derecha
    yl+=a*(vl-yl); yr+=a*(vr-yr); wL[i]=yl; wR[i]=yr; oL[i]+=yl*mix; oR[i]+=yr*mix; }
  return [oL,oR];
}
function reverbFx(L,R,m,p){          // Freeverb: 8 peines + 4 pasatodo por canal, con un poco de separación estéreo
  const sc=SR/44100, cd=[1116,1188,1277,1356,1422,1491,1557,1617], ad=[556,441,341,225], sp=23;
  const fbk=revFbk(p.size), dmp=clamp(p.damp,0,1)*.6, pre=Math.round(clamp(p.pre,0,200)*SR/1000), wet=clamp(p.mix,0,1)*REV_WET*revComp(p.size)*3, nL=L.length;
  const mk=(arr,add)=>arr.map(v=>new Float32Array(Math.max(1,Math.round((v+add)*sc))));
  const cL=mk(cd,0),cR=mk(cd,sp),aL=mk(ad,0),aR=mk(ad,sp), ciL=new Int32Array(8),ciR=new Int32Array(8),aiL=new Int32Array(4),aiR=new Int32Array(4), fL=new Float32Array(8),fR=new Float32Array(8);
  const oL=new Float32Array(m),oR=new Float32Array(m);
  for(let i=0;i<m;i++){
    const j=i-pre, inp=(j>=0&&j<nL)?(L[j]+R[j])*.015:0; let sl=0,sr=0;
    for(let k=0;k<8;k++){
      let b=cL[k],ix=ciL[k],o=b[ix]; fL[k]=o*(1-dmp)+fL[k]*dmp; b[ix]=inp+fL[k]*fbk; ciL[k]=++ix>=b.length?0:ix; sl+=o;
      b=cR[k]; ix=ciR[k]; o=b[ix]; fR[k]=o*(1-dmp)+fR[k]*dmp; b[ix]=inp+fR[k]*fbk; ciR[k]=++ix>=b.length?0:ix; sr+=o;
    }
    for(let k=0;k<4;k++){
      let b=aL[k],ix=aiL[k],o=b[ix]; b[ix]=sl+o*.5; sl=o-sl; aiL[k]=++ix>=b.length?0:ix;
      b=aR[k]; ix=aiR[k]; o=b[ix]; b[ix]=sr+o*.5; sr=o-sr; aiR[k]=++ix>=b.length?0:ix;
    }
    oL[i]=(i<nL?L[i]:0)+sl*wet; oR[i]=(i<nL?R[i]:0)+sr*wet;
  }
  return [oL,oR];
}
function applyFx(L,R,fx,beat,maxLen){      // → {L,R}; la salida puede ser más larga que la entrada (cola del eco y de la reverb)
  const n=L.length; let tail=0; const dly=fx.delay.on&&fx.delay.mix>0, rev=fx.reverb.on&&fx.reverb.mix>0;
  if(dly){ const d=Math.max(1,Math.round(fx.delay.time*beat*SR)), fb=clamp(fx.delay.fb,0,.92); tail+=Math.min(8*SR,d*((fb>0?Math.ceil(Math.log(.001)/Math.log(fb)):0)+1)); }
  if(rev){ const fbk=revFbk(fx.reverb.size); tail+=Math.min(6*SR,Math.ceil((1400/44100)*SR*Math.log(.001)/Math.log(fbk)))+Math.round(clamp(fx.reverb.pre,0,200)*SR/1000); }
  const m=Math.min(maxLen==null?n+tail:maxLen,n+tail); let a=L,b=R;
  if(dly) [a,b]=delayFx(a,b,m,fx.delay,beat);
  if(rev) [a,b]=reverbFx(a,b,m,fx.reverb);
  return {L:a,R:b};
}
function fxStems(stems,fx,beat,N){
  return stems.map(st=>{
    const len=st.q[0].length, g=st.pk/32767, L=new Float32Array(len), R=new Float32Array(len); for(let i=0;i<len;i++){ L[i]=st.q[0][i]*g; R[i]=st.q[1][i]*g; }
    const r=applyFx(L,R,fx,beat,N-st.s0), n=r.L.length; let pk=0; for(let i=0;i<n;i++){ const a=Math.abs(r.L[i]),b=Math.abs(r.R[i]); if(a>pk) pk=a; if(b>pk) pk=b; }
    const k=pk>0?32767/pk:0, qa=new Int16Array(n), qb=new Int16Array(n); for(let i=0;i<n;i++){ qa[i]=Math.round(r.L[i]*k); qb[i]=Math.round(r.R[i]*k); }
    return {bus:st.bus,s0:st.s0,pk,q:[qa,qb]};
  });
}
function withFx(P,tr,out,extra){            // para la vista previa y para tocar en vivo
  const fx=fxOf(tr); if(!fxActive(fx)) return out; const r=applyFx(out.L,out.R,fx,60/P.bpm,out.L.length+(extra==null?3*SR:extra)); return {L:r.L,R:r.R,dur:r.L.length/SR};
}
function shelf(L,R,f,dB,high){              // filtro shelving (biquad RBJ), en el sitio
  if(!dB) return; const A=Math.pow(10,dB/40), w=2*Math.PI*f/SR, cs=Math.cos(w), al=Math.sin(w)/2*Math.SQRT2, t=2*Math.sqrt(A)*al; let b0,b1,b2,a0,a1,a2;
  if(!high){ b0=A*((A+1)-(A-1)*cs+t); b1=2*A*((A-1)-(A+1)*cs); b2=A*((A+1)-(A-1)*cs-t); a0=(A+1)+(A-1)*cs+t; a1=-2*((A-1)+(A+1)*cs); a2=(A+1)+(A-1)*cs-t; }
  else { b0=A*((A+1)+(A-1)*cs+t); b1=-2*A*((A-1)+(A+1)*cs); b2=A*((A+1)+(A-1)*cs-t); a0=(A+1)-(A-1)*cs+t; a1=2*((A-1)-(A+1)*cs); a2=(A+1)-(A-1)*cs-t; }
  b0/=a0; b1/=a0; b2/=a0; a1/=a0; a2/=a0;
  for(const X of [L,R]){ let x1=0,x2=0,y1=0,y2=0; for(let i=0;i<X.length;i++){ const x=X[i], y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2; x2=x1; x1=x; y2=y1; y1=y; X[i]=y; } }
}
function masterFx(P,out){
  const m=masterOf(P); if(!m.low&&!m.high&&m.gain===1) return out;          // todo neutro: no se toca el sonido original
  const L=Float32Array.from(out.L), R=Float32Array.from(out.R), n=L.length; shelf(L,R,120,m.low,false); shelf(L,R,7000,m.high,true);
  const g=m.gain, ceil=clamp(m.ceil,.3,1), oL=new Float32Array(n), oR=new Float32Array(n);
  if(m.limit){      // limitador con anticipación de 1.5 ms: el audio se retrasa W muestras para que la ganancia ya haya bajado cuando llegue el pico
    const W=Math.round(.0015*SR), rel=1-Math.exp(-1/(.08*SR)); let gr=1;
    for(let i=0;i<n;i++){ const pk=Math.max(Math.abs(L[i]),Math.abs(R[i]))*g, t=pk>ceil?ceil/pk:1;
      if(t<gr) gr=Math.max(t,gr-1/W); else gr=Math.min(t,gr+(1-gr)*rel+1e-7);
      const j=i-W; if(j>=0){ oL[i]=clamp(L[j]*g*gr,-ceil,ceil); oR[i]=clamp(R[j]*g*gr,-ceil,ceil); } }
  } else for(let i=0;i<n;i++){ oL[i]=clamp(L[i]*g,-1,1); oR[i]=clamp(R[i]*g,-1,1); }
  return {L:oL,R:oR,dur:out.dur};
}

// ───────────────────────── render por pista (stems con caché) ─────────────────────────
// Cada pista se renderiza sola en su propio kit y se guarda como «stem» (Int16 recortado al tramo con sonido).
// La mezcla final se hace aparte con el K.mix del kit (sidechain, saturación suave, fundido). Volumen, mute y solo
// se aplican al mezclar, así que cambiarlos no vuelve a renderizar nada; editar una pista solo renderiza esa pista.
const stemCache=new Map(); let KIT_REV=0; const STEM_BUDGET=320*1048576;   // tope de memoria de la caché (bytes)
const stemBytes=c=>c.stems.reduce((a,st)=>a+st.q[0].length*4,0)+(c.fxStems?c.fxStems.reduce((a,st)=>a+st.q[0].length*4,0):0);
function stemMemory(){ let m=0; for(const c of stemCache.values()) m+=stemBytes(c); return m; }
function trimStems(keep){ let m=stemMemory(); if(m<=STEM_BUDGET) return; for(const [id,c] of stemCache){ if(keep.has(id)) continue; m-=stemBytes(c); stemCache.delete(id); if(m<=STEM_BUDGET) break; } }
function bumpKit(){ KIT_REV++; stemCache.clear(); }
function trackKey(P,tr,total){ const inst=INSTRUMENTS[tr.inst]; return hash2(JSON.stringify([tr.inst,inst?inst.rev:0,KIT_REV,tr.params,tr.pan,tr.ducked?1:0,P.bpm,P.seed,total,tr.notes])); }
const trackSeed=(P,tr)=>(((P.seed||KIT_SEED)^parseInt(hash2(String(tr.id)).split('-')[0],36))>>>0)||1;
function extractStems(K){
  const out=[];
  for(const bus of ['mu','dr']){
    const A=K[bus][0],B=K[bus][1],n=A.length; let s0=-1,s1=0;
    for(let i=0;i<n;i++){ if(A[i]!==0||B[i]!==0){ s0=i; break; } } if(s0<0) continue;
    for(let i=n-1;i>=s0;i--){ if(A[i]!==0||B[i]!==0){ s1=i+1; break; } }
    let pk=0; for(let i=s0;i<s1;i++){ const a=Math.abs(A[i]),b=Math.abs(B[i]); if(a>pk) pk=a; if(b>pk) pk=b; } if(!(pk>0)) continue;
    const k=32767/pk,qa=new Int16Array(s1-s0),qb=new Int16Array(s1-s0); for(let i=s0;i<s1;i++){ qa[i-s0]=Math.round(A[i]*k); qb[i-s0]=Math.round(B[i]*k); }
    out.push({bus,s0,pk,q:[qa,qb]});
  }
  return out;
}
async function renderTrackStem(P,tr,beat,total){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible ('+tr.inst+')');
  const K=Kit.make(SR,total,trackSeed(P,tr)); K.sr=SR; const t=Object.assign({},tr,{vol:1}); let last=performance.now(),i=0;
  for(const nt of tr.notes.slice().sort((a,b)=>a.b-b.b)){ inst.play(K,noteArgs(K,P,t,nt,beat)); if(++i%25===0&&performance.now()-last>14){ await tick(); last=performance.now(); } }
  return extractStems(K);
}
async function ensureStems(P,trs,onProg,from,to){
  const beat=60/P.bpm, total=P.bars*beat*4+TAIL, live=new Set(P.tracks.map(t=>t.id)), errors=[], todo=[]; let tot=0;
  for(const id of [...stemCache.keys()]) if(!live.has(id)) stemCache.delete(id);
  for(const tr of trs){ const key=trackKey(P,tr,total),c=stemCache.get(tr.id); if(c&&c.key===key){ if(c.err) errors.push({track:tr.name,msg:c.err}); continue; } todo.push({tr,key}); tot+=tr.notes.length+1; }
  let done=0; for(const {tr,key} of todo){
    const e={key,stems:[]}; try{ e.stems=await renderTrackStem(P,tr,beat,total); }catch(err){ e.err=err.message; errors.push({track:tr.name,msg:err.message}); }
    stemCache.set(tr.id,e); done+=tr.notes.length+1; if(onProg) onProg(from+(to-from)*done/tot); await tick();
  }
  let fxN=0, N=Math.ceil(total*SR);
  for(const tr of trs){ const c=stemCache.get(tr.id); if(!c||c.err) continue; const fx=fxOf(tr), want=fxActive(fx)?hash2(JSON.stringify([fx,beat,c.key])):'';
    if(c.fxKey!==want){ c.fxStems=want?fxStems(c.stems,fx,beat,N):null; c.fxKey=want; if(want){ fxN++; await tick(); } } }
  return {errors,rendered:todo.length,fx:fxN,beat,total};
}
// ── automatización por pista (volumen, paneo, filtro): puntos {b,v} en pulsos, interpolación lineal; se aplica al mezclar,
// así que editarla no vuelve a renderizar ningún instrumento
const AUTO_DEF={vol:{label:'Volumen',min:0,max:1.5,def:1},pan:{label:'Paneo',min:-1,max:1,def:0},cut:{label:'Filtro',min:0,max:1,def:1}};
const cutHz=c=>80*Math.pow(18000/80,clamp(c,0,1));
function autoPts(tr,k){ const a=tr.auto&&tr.auto[k]; return a&&a.length?a.slice().sort((x,y)=>x.b-y.b):null; }
function autoValue(pts,b){ if(b<=pts[0].b) return pts[0].v; for(let j=0;j<pts.length-1;j++){ if(b<pts[j+1].b){ const d=pts[j+1].b-pts[j].b; return d>0?pts[j].v+(pts[j+1].v-pts[j].v)*(b-pts[j].b)/d:pts[j+1].v; } } return pts[pts.length-1].v; }
function autoSampler(pts,beat){ let j=0; const T=pts.map(p=>p.b*beat*SR), n=pts.length;
  return i=>{ if(i<=T[0]) return pts[0].v; while(j<n-1&&T[j+1]<=i) j++; if(j>=n-1) return pts[n-1].v; return pts[j].v+(pts[j+1].v-pts[j].v)*(i-T[j])/(T[j+1]-T[j]); }; }
function mixAuto(K0,st,vol,A,beat){
  const q0=st.q[0],q1=st.q[1],d0=K0[st.bus][0],d1=K0[st.bus][1],o=st.s0,n=q0.length,base=vol*st.pk/32767;
  const sv=A.vol&&autoSampler(A.vol,beat), sp=A.pan&&autoSampler(A.pan,beat), sc=A.cut&&autoSampler(A.cut,beat);
  let a1=0,a2=0,b1=0,b2=0,al=1;     // filtro: dos polos simples en cascada (12 dB/oct), un canal por cada par
  for(let i=0;i<n;i++){ const t=o+i; let g=base; if(sv) g*=Math.max(0,sv(t)); let x=q0[i]*g,y=q1[i]*g;
    if(sp){ const p=clamp(sp(t),-1,1); if(p>0) x*=1-p; else y*=1+p; }
    if(sc){ if((i&31)===0){ const c=sc(t); al=c>=.999?1:1-Math.exp(-2*Math.PI*cutHz(c)/SR); }
      if(al<1){ a1+=al*(x-a1); a2+=al*(a1-a2); b1+=al*(y-b1); b2+=al*(b1-b2); x=a2; y=b2; } else { a1=a2=x; b1=b2=y; } }
    d0[o+i]+=x; d1[o+i]+=y; }
}
async function mixStems(P,trs,total,beat){
  const K0=Kit.make(SR,total,P.seed||KIT_SEED); K0.sr=SR;
  for(const tr of trs){ const c=stemCache.get(tr.id); if(!c) continue; const vol=tr.vol==null?1:tr.vol, A={vol:autoPts(tr,'vol'),pan:autoPts(tr,'pan'),cut:autoPts(tr,'cut')}, any=A.vol||A.pan||A.cut;
    for(const st of (c.fxStems||c.stems)){ if(any){ mixAuto(K0,st,vol,A,beat); continue; } const g=vol*st.pk/32767; for(let ch=0;ch<2;ch++){ const d=K0[st.bus][ch],q=st.q[ch],o=st.s0; for(let i=0;i<q.length;i++) d[o+i]+=q[i]*g; } }
    await tick(); }
  return K0.mix(makeDuck(P,beat));
}
async function renderProject(P,onProg){
  const solo=P.tracks.some(t=>t.solo), trs=P.tracks.filter(t=>!t.mute&&(!solo||t.solo));
  const r=await ensureStems(P,trs,onProg,0,.85); if(onProg) onProg(.9); await tick();
  const out=masterFx(P,await mixStems(P,trs,r.total,r.beat)); trimStems(new Set(trs.map(t=>t.id))); out.errors=r.errors; out.stats={tracks:trs.length,rendered:r.rendered,fx:r.fx}; return out;
}
// un audio por pista (con el sidechain y la saturación del master, como suenan solas); incluye pistas silenciadas
async function renderStems(P,onProg){
  const trs=P.tracks.filter(t=>t.notes.length), r=await ensureStems(P,trs,onProg,0,.5), files=[];
  for(let i=0;i<trs.length;i++){ const o=await mixStems(P,[trs[i]],r.total,r.beat); files.push({name:trs[i].name,L:o.L,R:o.R}); if(onProg) onProg(.5+.5*(i+1)/trs.length); await tick(); }
  return {files,errors:r.errors};
}
function previewBuffer(P,tr,nt){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible');
  const beat=60/P.bpm, dur=Math.min(5,Math.max(.4,(nt.l||.25)*beat)+2.6), K=Kit.make(SR,dur,7); K.sr=SR;
  inst.play(K,noteArgs(K,P,tr,Object.assign({},nt,{b:0}),beat,0)); return withFx(P,tr,K.mix(()=>1));
}

// Nota para tocar en vivo: se renderiza con volumen 1 (el volumen y la velocidad se aplican después como ganancia),
// y el largo es fijo; al soltar la tecla la interfaz hace el fundido de salida.
function liveNoteBuffer(P,tr,m,lenSec){
  const inst=INSTRUMENTS[tr.inst]; if(!inst) throw new Error('instrumento no disponible');
  const beat=60/P.bpm, dur=inst.oneShot?3:lenSec+.8, K=Kit.make(SR,dur,7); K.sr=SR;
  const t=Object.assign({},tr,{vol:1});
  inst.play(K,noteArgs(K,P,t,{b:0,l:inst.oneShot?.25:lenSec/beat,m,v:1},beat,0)); return withFx(P,tr,K.mix(()=>1));
}

// ───────────────────────── WAV ─────────────────────────
function encodeWav(L,R,sr){
  const n=L.length,buf=new ArrayBuffer(44+n*4),v=new DataView(buf); const ws=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF'); v.setUint32(4,36+n*4,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true);
  v.setUint32(24,sr,true); v.setUint32(28,sr*4,true); v.setUint16(32,4,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,n*4,true);
  let o=44; for(let i=0;i<n;i++){ let s=L[i]; s=s>1?1:s<-1?-1:s; v.setInt16(o,s<0?s*32768:s*32767,true); o+=2; s=R[i]; s=s>1?1:s<-1?-1:s; v.setInt16(o,s<0?s*32768:s*32767,true); o+=2; }
  return new Blob([buf],{type:'audio/wav'});
}

// ───────────────────────── (de)serialización ─────────────────────────
function u8ToB64(u8){let s='';const C=0x8000;for(let i=0;i<u8.length;i+=C)s+=String.fromCharCode.apply(null,u8.subarray(i,i+C));return btoa(s);}
function b64ToU8(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
function projectToJSON(P){
  const o={format:'demokit-studio',v:1,name:P.name,bpm:P.bpm,bars:P.bars,seed:P.seed,sc:{mode:P.sc.mode,depth:P.sc.depth,rel:P.sc.rel,rate:P.sc.rate},master:masterOf(P),key:P.key||undefined,tracks:P.tracks,clips:{},plugins:[]};
  if(P.sc.table){ const T=P.sc.table,u=new Uint8Array(T.length); for(let i=0;i<T.length;i++) u[i]=Math.round(clamp(T[i],0,1)*255); o.sc.table=u8ToB64(u); }
  for(const cid in P.clips){ const d=P.clips[cid],q=new Int16Array(d.length); for(let i=0;i<d.length;i++) q[i]=clamp(Math.round(d[i]*16384),-32768,32767); o.clips[cid]=u8ToB64(new Uint8Array(q.buffer)); }
  const used=new Set(P.tracks.map(t=>t.inst)); for(const u of USER_PLUGINS) if(used.has(u.id)) o.plugins.push(u);
  return o;
}
function projectFromJSON(o){
  const errs=[]; for(const u of o.plugins||[]){ try{ installPlugin(u.code); }catch(e){ errs.push(u.id+': '+e.message); } }
  const P=newProject(o.name,o.bpm,o.bars); P.seed=o.seed||KIT_SEED; Object.assign(P.sc,o.sc||{}); P.sc.table=null; P.master=Object.assign({},MASTER_DEF,o.master||{}); if(o.key) P.key=Object.assign({root:0,scale:'off',fit:false},o.key);
  if(o.sc&&o.sc.table){ const u=b64ToU8(o.sc.table),T=new Float32Array(u.length); for(let i=0;i<u.length;i++) T[i]=u[i]/255; P.sc.table=T; }
  for(const cid in o.clips||{}){ const u=b64ToU8(o.clips[cid]),q=new Int16Array(u.buffer,u.byteOffset,u.length>>1),d=new Float32Array(q.length); for(let i=0;i<q.length;i++) d[i]=q[i]/16384; P.clips[cid]=d; }
  P.tracks=(o.tracks||[]).map(fixTrack); P.loadErrors=errs; return P;
}

// ───────────────────────── conversión de demos → proyecto editable ─────────────────────────
// Se ejecuta la demo con un "kit grabador": cada llamada a kick/snare/syn/bell/… queda registrada en lugar de sonar.
// Las funciones auxiliares conocidas (reese, growl, rim, wash, impact) se interceptan reescribiendo su cabecera.
const HELPERS={
  reese:{inst:'reese',buf:'mu',map(a,bt){const [t0,len,m,amp,o]=a,oo=o||{};return{t0,len,m,a:amp,pan:0,p:{lfoB:r6((oo.lfo||0)*bt),lo:oo.lo||300,hi:oo.hi||1400,drive:oo.drive||2.2}};}},
  growl:{inst:'growl',buf:'mu',map(a,bt){const [t0,len,m,amp,rate]=a;return{t0,len,m,a:amp,pan:0,p:{rateB:r6(rate*bt)}};}},
  rim:{inst:'rim',buf:'dr',map(a){const [t0,amp,pan]=a;return{t0,len:null,m:0,a:amp,pan:pan||0,p:{}};}},
  wash:{inst:'wash',buf:'mu',map(a){const [t0,len,amp,fc]=a;return{t0,len,m:0,a:amp,pan:0,p:{fc}};}},
  impact:{inst:'impact',buf:'mu',map(a){const [t0,amp]=a;return{t0,len:null,m:0,a:amp,pan:0,p:{}};}}
};
function detToParams(det){
  const V=det.length; if(V===1) return det[0]===0?{voices:1,spread:0}:{voices:1,spread:0,detRaw:det.slice()};
  const S=Math.max.apply(null,det.map(Math.abs)),gen=[]; for(let i=0;i<V;i++) gen.push(-S+2*S*i/(V-1));
  return gen.every((g,i)=>Math.abs(g-det[i])<1e-6)?{voices:V,spread:S}:{voices:V,spread:S,detRaw:det.slice()};
}
function lpToParams(lp){
  if(lp==null) return {lp:3000,lpSweep:0,lpRate:10};
  if(typeof lp==='number') return {lp,lpSweep:0,lpRate:10};
  const src=String(lp), m=/^\s*\(?\s*t\s*\)?\s*=>\s*([\d.]+)\s*\+\s*([\d.]+)\s*\*\s*Math\.exp\(\s*-\s*t\s*\*\s*([\d.]+)\s*\)\s*$/.exec(src);
  return m?{lp:+m[1],lpSweep:+m[2],lpRate:+m[3]}:{lp:3000,lpSweep:0,lpRate:10,lpSrc:src};
}
function callerName(skip){
  try{ const st=(new Error().stack||'').split('\n'); const bad=new Set(['callerName','add','Object.add','K.add','Array.map','map','Object.assign']);
    for(const s of st){ const m=/at\s+(?:async\s+)?([A-Za-z_$][\w$.]*)\s*\(/.exec(s)||/^\s*([A-Za-z_$][\w$]*)@/.exec(s); if(!m||bad.has(m[1])) continue; return m[1]===skip?'inline':m[1]; } }catch(e){}
  return '?';
}
function mapEvent(e,bt){
  const mid=f=>{const m=69+12*Math.log2(f/440),r=Math.round(m);return Math.abs(m-r)<1e-3?r:+m.toFixed(3);};
  const oneShot=(inst,t0,a,pan,m,p)=>({inst,buf:'dr',t0,len:null,m:m||0,a,pan:pan||0,p:p||{}});
  switch(e.fn){
    case 'kick':{const o=e.o;return oneShot('kick',e.t0,e.a,0,0,{lo:o.lo||46,hi:o.hi||151,k:o.k||30,dec:o.dec||6.5,len:o.len||.45,click:o.click==null?.3:o.click});}
    case 'snare':{const o=e.o;return oneShot('snare',e.t0,e.a,0,0,{tone:o.tone||185,nd:o.nd||20,td:o.td||28,len:o.len||.25});}
    case 'clap': return oneShot('clap',e.t0,e.a,0,0);
    case 'snap': return oneShot('snap',e.t0,e.a,e.pan,0);
    case 'hat': return oneShot('hat',e.t0,e.a,e.pan,e.open?1:0);
    case 'crash': return oneShot('crash',e.t0,e.a,0,0,{len:e.len});
    case 'syn':{const o=e.o,p=Object.assign({w:o.w||0,atk:o.atk||.004,rel:o.rel||.06,dec:o.dec||0,detRaw:null,lpSrc:null},detToParams(o.det||[0]),lpToParams(o.lp));
      return {inst:'sinte',buf:e.buf,t0:e.t0,len:e.len,m:mid(e.f),a:e.a,pan:e.pan,p,gkey:JSON.stringify([e.buf,p.w,o.det||[0],p.atk,p.rel,p.dec])};}
    case 'bell': return {inst:'bell',buf:'mu',t0:e.t0,len:null,m:e.m,a:e.a,pan:e.pan,p:{len:e.len}};
    case 'chop': return {inst:'chop',buf:'mu',t0:e.t0,len:e.len,m:e.m,a:e.a,pan:e.pan,p:{v:e.v}};
    case 'riser': return {inst:'riser',buf:'mu',t0:e.t0,len:e.len,m:0,a:e.a,pan:0,p:{}};
    case 'sweep': return {inst:'sweep',buf:'mu',t0:e.t0,len:e.len,m:0,a:e.a,pan:0,p:{f0:e.f0,f1:e.f1}};
    case 'helper':{const h=HELPERS[e.name],x=h.map(e.args,bt);return Object.assign({inst:h.inst,buf:h.buf},x);}
    case 'add': return {inst:'clip',buf:e.buf,t0:e.t0,len:e.len,m:0,a:e.amp,pan:e.pan,p:{},data:e.data,caller:e.caller};
  }
  return null;
}
const TRACK_NAMES={kick:'Bombo',snare:'Caja',clap:'Palma',snap:'Chasquido',hat:'Hi-hat',crash:'Crash',bell:'Campanas',chop:'Sílabas (chop)',riser:'Riser',sweep:'Barrido',reese:'Reese',growl:'Growl',rim:'Rim',wash:'Viento',impact:'Impacto'};
function guessName(g){
  if(TRACK_NAMES[g.inst]) return TRACK_NAMES[g.inst];
  if(g.inst==='clip') return 'Clip · '+(g.caller==='inline'?'add() en línea':g.caller);
  const p=g.items[0].p; if(p.atk>=.3) return 'Pad'; if(p.w===2) return 'Sub (seno)'; if(p.voices>=5) return 'Supersaw';
  if(p.dec>=5) return p.w===1?'Arpegio cuadrado':'Pluck / arpegio'; return p.voices>1?'Sinte':'Capa de sierra';
}
function buildProject(events,meta){
  const beat=60/meta.bpm, P=newProject(meta.title,meta.bpm,meta.bars); P.seed=meta.seed||KIT_SEED;
  const groups=new Map(); let nItems=0;
  for(const e of events){ const it=mapEvent(e,beat); if(!it) continue; nItems++;
    const key=it.gkey||(it.inst+'|'+it.buf+(it.inst==='clip'?'|'+it.caller:'')); let g=groups.get(key);
    if(!g){ g={inst:it.inst,buf:it.buf,caller:it.caller,items:[]}; groups.set(key,g); } g.items.push(it); }
  let ci=0; const trs=[], seen={};
  for(const g of groups.values()){
    const inst=INSTRUMENTS[g.inst], base=defaultParams(inst); let gain=0; for(const it of g.items) gain=Math.max(gain,it.a||0); if(!(gain>0)) gain=1;
    const keys=new Set(); g.items.forEach(it=>Object.keys(it.p).forEach(k=>keys.add(k)));
    for(const k of keys){ const cnt=new Map(); let best=null,bn=0; for(const it of g.items){ const s=JSON.stringify(it.p[k]),c=(cnt.get(s)||0)+1; cnt.set(s,c); if(c>bn){bn=c;best=it.p[k];} } base[k]=best; }
    base.gain=r6(gain);
    const notes=g.items.map(it=>{
      const nt={b:r6(it.t0/beat),l:it.len!=null?r6(it.len/beat):.25,m:it.m,v:r6((it.a||0)/gain)}; if(it.pan) nt.pan=r6(it.pan);
      const o={}; for(const k of keys){ if(JSON.stringify(it.p[k])!==JSON.stringify(base[k])) o[k]=it.p[k]===undefined?null:it.p[k]; }
      if(it.data){ const cid='c'+(++ci); P.clips[cid]=it.data; o.cid=cid; }
      if(Object.keys(o).length) nt.o=o; return nt; }).sort((a,b)=>a.b-b.b);
    let name=guessName(g); seen[name]=(seen[name]||0)+1; if(seen[name]>1) name+=' '+seen[name];
    trs.push({id:uid(),name,inst:g.inst,params:base,vol:1,pan:0,mute:false,solo:false,ducked:g.buf==='mu',sc:g.inst==='kick',notes});
  }
  const rank=['kick','snare','clap','snap','hat','crash']; const ord=t=>{const i=rank.indexOf(t.inst);return i<0?100:i;};
  P.tracks=trs.map((t,i)=>({t,i})).sort((a,b)=>ord(a.t)-ord(b.t)||a.i-b.i).map(x=>x.t);
  if(meta.duckAt){ const R=800,N=Math.ceil((meta.seconds||0)*R)+2,T=new Float32Array(N); for(let i=0;i<N;i++) T[i]=clamp(meta.duckAt(i/R),0,1.5);
    P.sc.table=T; P.sc.rate=R; P.sc.mode='table'; let mn=1; for(const v of T) if(v<mn) mn=v; P.sc.depth=r6(clamp(1-mn,.05,.95)); P.sc.rel=.09; }
  return {project:P,stats:{tracks:P.tracks.length,notes:nItems,clips:ci}};
}
async function recordDemo(src,opts){
  opts=opts||{};
  const m=/async\s+function\s+(render\w*)\s*\(/.exec(src); if(!m) throw new Error('No encontré una función async render…(sr, onProg) en el archivo.');
  const fnName=m[1], events=[]; let duckAt=null, seconds=0, seed=null;
  const bm=/\bBPM\s*=\s*([\d.]+)/.exec(src)||/([\d.]+)\s*BPM/i.exec(src); const bpm=bm?+bm[1]:(opts.bpm||120);
  const bake=(fn,len)=>{ const N=Math.max(0,Math.floor(len*SR)),d=new Float32Array(N); for(let i=0;i<N;i++) d[i]=fn(i/SR); return d; };
  const recKit=(sr,secs,seed0)=>{
    seconds=secs; seed=seed0; const real=Kit.make(sr,.05,seed0), K=Object.assign({},real), rec=(fn,o)=>{events.push(Object.assign({fn},o));};
    K.n=Math.ceil(secs*sr);
    K.kick=(t0,a,o)=>rec('kick',{t0,a,o:Object.assign({},o||{})});
    K.snare=(t0,a,o)=>rec('snare',{t0,a,o:Object.assign({},o||{})});
    K.clap=(t0,a)=>rec('clap',{t0,a});
    K.snap=(t0,a,pan)=>rec('snap',{t0,a,pan:pan||0});
    K.hat=(t0,a,open,pan)=>rec('hat',{t0,a,open:!!open,pan:pan||0});
    K.crash=(t0,a,len)=>rec('crash',{t0,a,len:len||2.4});
    K.syn=(buf,t0,len,f,a,pan,o)=>rec('syn',{buf:buf===real.mu?'mu':'dr',t0,len,f,a,pan:pan||0,o:Object.assign({},o||{})});
    K.bell=(t0,mm,a,pan,len)=>rec('bell',{t0,m:mm,a,pan:pan||0,len:len||1.4});
    K.chop=(t0,len,mm,a,pan,v)=>rec('chop',{t0,len,m:mm,a,pan:pan||0,v:v||'oh'});
    K.riser=(t0,len,a)=>rec('riser',{t0,len,a});
    K.sweep=(t0,len,f0,f1,a)=>rec('sweep',{t0,len,f0,f1,a});
    K.add=(buf,t0,len,fn,amp,pan)=>rec('add',{buf:buf===real.mu?'mu':'dr',t0,len,amp,pan:pan||0,data:bake(fn,len),caller:callerName(fnName)});
    K.mix=d=>{duckAt=d;return{L:new Float32Array(1),R:new Float32Array(1),dur:secs};};
    return K;
  };
  const __enter=(name,args)=>{ if(!HELPERS[name]) return false; events.push({fn:'helper',name,args:args.map(x=>x&&typeof x==='object'?Object.assign({},x):x)}); return true; };
  const patched=src.replace(/(^|\n)([ \t]*)function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{/g,(mm,pre,ws,name,args)=>{
    if(/[{\[.]/.test(args)) return mm; const list=args.split(',').map(s=>s.split('=')[0].trim()).filter(Boolean);
    return pre+ws+'function '+name+'('+args+'){ if(__enter('+JSON.stringify(name)+',['+list.join(',')+'])) return;'; });
  const render=new Function('demoKit','sleep','__enter',patched+'\nreturn '+fnName+';')(recKit,sleep,__enter);
  await render(SR,null);
  const beat=60/bpm, bm2=/\bBARS\s*=\s*(\d+)/.exec(src), bars=bm2?+bm2[1]:Math.max(1,Math.round((seconds-TAIL)/(beat*4)));
  const tm=/^\/\/\s*[─\-—–\s]*([^·\n]+?)\s*·/m.exec(src);
  const title=opts.name||(tm?tm[1].trim():fnName);
  return buildProject(events,{bpm,bars,seed,seconds,duckAt,title});
}
  // ═══ fin del motor ═══
  SR = sr || 44100;
  const P = projectFromJSON(JSON.parse(decodeURIComponent(escape(atob(__DEMOKIT_PROJECT__)))));
  return await renderProject(P, onProg);
}
