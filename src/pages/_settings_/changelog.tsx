import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import { Collapse } from 'react-vant';
import { Layout } from '../../components/Layout';

const Changelog: NextPage = () => {
  return (
    <Layout>
      <NavBarApp title="Registros de Cambios" />
      <Collapse initExpanded={['1']}>
        <Collapse.Item title="V 2.1.0 - 02 de febrero del 2025" name="1">
          <ul>
            <li>
              1. Se añade reporte de area para Regikids (Opción solamente para
              supervisores y coordinadores del area)
            </li>
            <li>
              2. Se añade un nuevo grupo de niños llamado &quot;Yo Soy
              Iglekids&quot;. Son un grupo especial de niños que sirven en el
              area de Iglekids.
            </li>
            <li>
              3. Se añade switch para marcar si un niño va servir en la iglesia
              de niños o va a servir en &quot;Yo Soy Iglekids&quot;
            </li>
            <li>4. Cambios y fixes menores.</li>
          </ul>
        </Collapse.Item>
        <Collapse.Item title="V 2.0.0 - 13 de enero del 2025" name="1">
          <ul>
            <li>
              1. Cambio del paquete gráfico de la aplicación. (Se cambian
              colores, transiciones, etc.)
            </li>
            <li>2. Cambio en la configuración inicial a uno más práctico.</li>
            <li>
              3. Acceso directo para cambiar servicio en caso de que se elija un
              servicio erróneo.
            </li>
            <li>
              4. Se arregló la subida de fotografías de los niños y se añade
              compresión de fotografías.
            </li>
            <li>
              5. Cambio en la distribución de la sección de configuración.
            </li>
            <li>
              6. Se añade extensión de teléfonos para números internacionales.
              Por defecto, será el de Colombia.
            </li>
            <li>
              7. De ahora en adelante se puede cambiar la relación de un
              acudiente con un niño en caso de ser erróneo.
            </li>
            <li>
              8. Se añade página de historial de cambios en configuraciones para
              estar enterados de los cambios de la aplicación.
            </li>
          </ul>
        </Collapse.Item>
        <Collapse.Item title="V 1.0.0 - 14 de octubre del 2023" name="2">
          Nació la aplicación 👶
        </Collapse.Item>
      </Collapse>
    </Layout>
  );
};

export default Changelog;
