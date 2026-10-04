import re

html_to_inject = """
    <div class="info-box" style="background: var(--bg-card); border: 2px solid #00c0a3; border-radius: var(--radius); padding: 25px; margin-top: 40px; margin-bottom: 30px; box-shadow: 4px 4px 0 #00c0a3;">
      <h4 style="margin-top: 0; color: #008773; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 2rem;">🏎️</span> 1. Conducir el Cutebot
      </h4>
      <p>El Cutebot usa un sistema llamado <strong>conducción diferencial</strong>. Como no tiene volante, para girar o moverse depende enteramente de la velocidad que le demos a sus dos ruedas traseras (velocidad de -100 a 100).</p>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
        <div style="flex: 1; min-width: 250px;">
          <h5 style="color: #008773;">Avanzar Recto</h5>
          <p style="font-size: 0.9rem;">Si ambas ruedas giran hacia adelante a la misma velocidad, el coche avanza en línea recta.</p>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top;">
            <div class="scratch-block scratch-hat s-events" style="background: #D400D4; border-color: #A000A0;">al presionar el botón <span class="s-input">A ▼</span></div>
            <div class="scratch-block s-motion" style="background: #00C0A3; border-color: #009982;">establecer motores <span class="s-input">izquierdo</span> a velocidad <span class="s-input">50</span> <span class="s-input">derecho</span> a velocidad <span class="s-input">50</span></div>
          </div>
        </div>
        
        <div style="flex: 1; min-width: 250px;">
          <h5 style="color: #008773;">Girar a la Derecha</h5>
          <p style="font-size: 0.9rem;">Si la rueda izquierda gira más rápido que la derecha (o la derecha se detiene a velocidad 0), el coche gira hacia la derecha.</p>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top;">
            <div class="scratch-block scratch-hat s-events" style="background: #D400D4; border-color: #A000A0;">al presionar el botón <span class="s-input">B ▼</span></div>
            <div class="scratch-block s-motion" style="background: #00C0A3; border-color: #009982;">establecer motores <span class="s-input">izquierdo</span> a velocidad <span class="s-input">50</span> <span class="s-input">derecho</span> a velocidad <span class="s-input">0</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-box" style="background: var(--bg-card); border: 2px solid #3b82f6; border-radius: var(--radius); padding: 25px; margin-bottom: 30px; box-shadow: 4px 4px 0 #3b82f6;">
      <h4 style="margin-top: 0; color: #2563eb; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 2rem;">🛣️</span> 2. El Coche Siguelíneas
      </h4>
      <p>El Cutebot tiene sensores de luz infrarroja apuntando al suelo que detectan si pisan la línea negra de un circuito o el suelo blanco de la mesa.</p>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
        <div style="flex: 1; min-width: 250px; font-size: 0.95rem;">
          <p>La lógica básica de un siguelíneas es usar un <strong>Bucle (por siempre)</strong> y <strong>Condicionales (si... entonces)</strong>:</p>
          <ul>
            <li><strong>Si</strong> los dos sensores ven blanco ➜ Avanzar.</li>
            <li><strong>Si</strong> el sensor izquierdo pisa negro ➜ Significa que nos salimos por la derecha, hay que girar a la izquierda para volver al carril.</li>
            <li><strong>Si</strong> el sensor derecho pisa negro ➜ Hay que girar a la derecha.</li>
          </ul>
        </div>
        <div style="flex: 1; min-width: 250px;">
          <div class="scratch-stack" style="transform: scale(0.8); transform-origin: left top;">
            <div class="scratch-block scratch-c-block s-control" style="background: #1E90FF; border-color: #0073E6;">
              por siempre
              <div class="scratch-inner">
                <div class="scratch-block scratch-c-block s-control" style="background: #00B3E6; border-color: #008CB3;">
                  si &lt;<span class="s-hex" style="background: #00C0A3;">¿línea de rastreo <span class="s-input">izquierdo</span> y <span class="s-input">derecho</span> no encendido?</span>&gt; entonces
                  <div class="scratch-inner">
                    <div class="scratch-block s-motion" style="background: #00C0A3; border-color: #009982;">ir hacia <span class="s-input">adelante</span> a toda velocidad <span class="s-input">30</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="info-box" style="background: var(--bg-card); border: 2px solid #e3008c; border-radius: var(--radius); padding: 25px; margin-bottom: 30px; box-shadow: 4px 4px 0 #e3008c;">
      <h4 style="margin-top: 0; color: #b3006e; font-size: 1.4rem; display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 2rem;">🎮</span> 3. Coche Teledirigido (Módulo Radio)
      </h4>
      <p>La placa Micro:bit tiene un módulo de <strong>Radio</strong> incorporado. Esto permite que múltiples placas se comuniquen entre sí de forma inalámbrica como si fueran Walkie-Talkies. ¡Podemos hacer un mando a distancia!</p>
      
      <div class="alert alert-warning" style="margin-bottom: 20px;">
        <strong>⚠️ Regla de Oro:</strong> Ambas placas deben sintonizar el mismo "canal". En programación lo llamamos <strong>establecer el Grupo de radio</strong>. Cada pareja de clase debe usar un grupo diferente (ej: Grupo 14) o las señales se cruzarán con los robots de otros alumnos.
      </div>

      <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;">
        <!-- MANDO -->
        <div style="flex: 1; min-width: 250px; background: #fff0f6; border: 1px dashed #e3008c; padding: 15px; border-radius: 8px;">
          <h5 style="color: #b3006e; margin-top: 0;">Placa 1: El Mando (En tus manos)</h5>
          <p style="font-size: 0.85rem;">Enviamos el texto "AVANZAR" por el aire cuando pulsamos un botón.</p>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top;">
            <div class="scratch-block scratch-hat s-events" style="background: #1E90FF; border-color: #0073E6;">al iniciar</div>
            <div class="scratch-block s-looks" style="background: #E3008C; border-color: #B3006E;">radio establecer grupo <span class="s-input">14</span></div>
          </div>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top; margin-top: 10px;">
            <div class="scratch-block scratch-hat s-events" style="background: #D400D4; border-color: #A000A0;">al presionar el botón <span class="s-input">A ▼</span></div>
            <div class="scratch-block s-looks" style="background: #E3008C; border-color: #B3006E;">radio enviar cadena <span class="s-input">"AVANZAR"</span></div>
          </div>
        </div>

        <!-- COCHE -->
        <div style="flex: 1; min-width: 250px; background: #e6fffa; border: 1px dashed #00c0a3; padding: 15px; border-radius: 8px;">
          <h5 style="color: #008773; margin-top: 0;">Placa 2: El Receptor (En el coche)</h5>
          <p style="font-size: 0.85rem;">Escuchamos la radio y si el mensaje es "AVANZAR", encendemos los motores.</p>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top;">
            <div class="scratch-block scratch-hat s-events" style="background: #1E90FF; border-color: #0073E6;">al iniciar</div>
            <div class="scratch-block s-looks" style="background: #E3008C; border-color: #B3006E;">radio establecer grupo <span class="s-input">14</span></div>
          </div>
          <div class="scratch-stack" style="transform: scale(0.85); transform-origin: left top; margin-top: 10px;">
            <div class="scratch-block scratch-hat s-events" style="background: #E3008C; border-color: #B3006E;">al recibir radio receivedString</div>
            <div class="scratch-block scratch-c-block s-control" style="background: #00B3E6; border-color: #008CB3;">
              si &lt;<span class="s-hex" style="background: #00B3E6;">receivedString = <span class="s-input">"AVANZAR"</span></span>&gt; entonces
              <div class="scratch-inner">
                <div class="scratch-block s-motion" style="background: #00C0A3; border-color: #009982;">ir hacia <span class="s-input">adelante</span> a velocidad <span class="s-input">50</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
"""

with open("temario/block3.html", "r", encoding="utf-8") as f:
    content = f.read()

# Find everything up to the <h3 style="margin-top: 30px;">¿Cómo funcionan juntos?</h3>
split_point = '<h3 style="margin-top: 30px;">¿Cómo funcionan juntos?</h3>'
if split_point in content:
    pre_content, post_content = content.split(split_point, 1)
    
    # We want to keep everything up to the CTA
    cta_point = '<div class="test-cta"'
    if cta_point in post_content:
        _, cta_content = post_content.split(cta_point, 1)
        cta_content = cta_point + cta_content
        
        new_content = pre_content + html_to_inject + "\n    " + cta_content
        
        with open("temario/block3.html", "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Updated block3.html successfully.")
    else:
        print("Error: CTA not found.")
else:
    print("Error: Split point not found.")
