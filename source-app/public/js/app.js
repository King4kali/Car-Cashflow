// const http = require("http");
// const fs = require("fs"); // Исправлено импортирование модуля fs
// const PORT = 3500;

// http.createServer(function (req, res) {
//     const url = req.url;
//     console.log(req.url);

//     // Устанавливаем заголовок ответа
//     res.writeHead(200, { 'Content-Type': 'text/html' });

//     switch (url) {
//         case "/":
//             console.log("main page");
//             res.write("<h1>Main</h1>");
//             break;
//         case "/contact":
//             console.log("contact page");
//             try {
//                 // Чтение файла с правильным параметром encoding
//                 let data = fs.readFileSync('./index.html', { encoding: 'utf8' });
//                 res.write(data);
//             } catch (error) {
//                 console.error('Error reading file:', error);
//                 res.write("<h1>500 Internal Server Error</h1>");
//             }
//             break;
//         default:
//             console.log('404');
//             res.write("<h1>404 Not Found</h1>");
//             break;
//     }
    
//     // Завершаем ответ
//     res.end();
// })
// .listen(PORT, () => {
//     console.log(`Server is listening on port ${PORT}`);
// });
