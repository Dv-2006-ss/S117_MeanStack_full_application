function render(blocks){

  if(!blocks || !Array.isArray(blocks)) return "";

  return blocks.map(block=>{

    if(block.type==="text")
      return `<p style="font-size:16px">${block.value}</p>`;

    if(block.type==="button")
      return `
        <a href="${block.url}"
           style="display:inline-block;padding:10px 20px;
           background:#007bff;color:#fff;text-decoration:none;
           border-radius:5px">
           ${block.text}
        </a>
      `;

    if(block.type==="image")
      return `<img src="${block.src}" width="300"/>`;

    return "";

  }).join("");
}

module.exports = render;