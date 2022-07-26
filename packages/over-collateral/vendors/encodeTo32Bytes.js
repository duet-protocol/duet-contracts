function strToHexCharCode(str) {
    　　if(str === "")
    　　　　return "";
    　　var hexCharCode = [];
    　　hexCharCode.push("0x");
    　　for(var i = 0; i < str.length; i++) {
    　　　　hexCharCode.push((str.charCodeAt(i)).toString(16));
    　　}
    　　return hexCharCode.join("");
}

function encodeTo32Bytes(str) {
    let strHex = strToHexCharCode(str)
    if(strHex.length < 66) {
        // console.log(strHex)
        let gap = 66 - strHex.length
        while(gap--) {
            strHex += '0'
        }
        return strHex
    } else if(strHex.length == 66) {
        return strHex
    } else {
        return new Error("输入的字符串过长，转换输出的bytes超过32个字节")
    }
}

module.exports = {
    encodeTo32Bytes
}
