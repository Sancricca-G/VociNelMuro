const messages = [
    "Ascolta il silenzio interrotto",
    "Sono dietro il muro adesso",
    "Non fidarti della tua ombra",
    "Scrivi solo se osservato",
    "Le voci non mentono mai",
    "Controlla la stanza vuota",
    "L’infiltrato è già tra voi",
    "Non leggere a voce alta",
    "Il muro conosce il tuo nome",
    "Chi ha scritto questo messaggio?"
];

const wall = document.getElementById("wall");
const votiSospetti = []; // mock array per i voti

messages.forEach((text, index) => {
    const div = document.createElement("div");
    div.className = "tile";
    div.style.animationDelay = `${index * 0.1}s`;

    const msg = document.createElement("p");
    msg.textContent = text;

    const button = document.createElement("button");
    button.textContent = "Sospetto?";
    button.addEventListener("click", () => {
        button.disabled = true;
        votiSospetti.push({ id: index, testo: text });

        const confirm = document.createElement("div");
        confirm.className = "confirm";
        confirm.textContent = "Voto registrato";
        div.appendChild(confirm);
    });

    div.appendChild(msg);
    div.appendChild(button);
    wall.appendChild(div);
});
