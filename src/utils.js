/*
 * Copyright 2024 Lei Cao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { ResponseType, Body, getClient } = window.parent.__TAURI__.http;
const { readTextFile, writeBinaryFile } = window.parent.__TAURI__.fs;

const gzhImageHost = {
    type: "gzh",
    appId: "",
    appSecret: "",
    accessToken: "",
    expireTime: 0,
    isEnabled: false
};
const defaultImageHosts = [
    gzhImageHost
];

const cache = {};

function setCache(key, value) {
    cache[key] = value;
}

function getCache(key) {
    return cache[key];
}

function deleteCache(key) {
    delete cache[key];
}

async function downloadImage(src) {
    const cached = getCache(src);
    if (cached) {
        return cached;
    }
    // 获取图片二进制数据
    const client = await getClient();
    const response = await client.get(src, {
        responseType: ResponseType.Binary
    });
    const arrayBuffer = await response.data;

    // 将 ArrayBuffer 转换为 Base64 字符串
    const base64String = arrayBufferToBase64(arrayBuffer);
    const mimeType = response.headers['content-type'] || 'image/png'; // 获取 MIME 类型

    const result = `data:${mimeType};base64,${base64String}`;
    setCache(src, result);
    return result;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function getCustomImageHosts() {
    let imageHosts = localStorage.getItem('customImageHosts');
    if (imageHosts) {
        imageHosts = JSON.parse(imageHosts);
    } else {
        imageHosts = defaultImageHosts;
    }
    return imageHosts;
}

function saveCustomImageHosts(imageHosts) {
    localStorage.setItem('customImageHosts', JSON.stringify(imageHosts));
}

function getEnabledImageHost() {
    const imageHosts = getCustomImageHosts();
    if (imageHosts) {
        for (const e of imageHosts) {
            if (e && e.isEnabled) {
                return e;
            }
        }
    }
    return null;
}

async function readAsText(resourcePath) {
    return await readTextFile(resourcePath);
}

async function writeAsBinary(filePath, arrayBuffer) {
    await writeBinaryFile(filePath, arrayBuffer);
}

async function setLastArticle(content) {
    localStorage.setItem('lastArticle', content);
}

async function handleImages(container) {
    container.querySelectorAll('img').forEach(async (element) => {
        const dataSrc = element.getAttribute('data-src');
        if (dataSrc && dataSrc.startsWith('https://mmbiz.qpic.cn')) {
            element.src = await downloadImage(dataSrc);
        }
    });
}

function revertImages(container) {
    container.querySelectorAll('img').forEach(async (element) => {
        const dataSrc = element.getAttribute('data-src');
        if (dataSrc && dataSrc.startsWith('https://mmbiz.qpic.cn')) {
            element.src = dataSrc;
        }
    });
}