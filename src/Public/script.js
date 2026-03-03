async function login() {

    const usuario = document.getElementById("usuario").value;
    const contraseña = document.getElementById("contraseña").value;

    const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contraseña })
    });

    const data = await res.json();

    document.getElementById("resultado").innerText = data.mensaje;
}

async function cargarLotes() {

    const res = await fetch("/api/lotes");
    const lotes = await res.json();

    const lista = document.getElementById("listaLotes");
    lista.innerHTML = "";

    lotes.forEach(l => {

        const li = document.createElement("li");

        li.innerText = `${l.nombre} - S/ ${l.precio} - ${l.estado}`;

        lista.appendChild(li);
    });
}