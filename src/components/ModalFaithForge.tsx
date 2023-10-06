import { capitalizeWords } from '../utils/text';
import { Button, List, Modal } from 'antd-mobile';

const ModalFaithForge = ({ kidGroup }: any) => {
  const toggleModal = () => {
    Modal.alert({
      content: ModalBody,
      showCloseButton: false,
    });
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }): React.ReactElement => (
    <List.Item
      key={index}
      description={`Genero: ${
        item.kidGender === 'M' ? 'Masculino' : 'Femenino'
      }`}
    >
      {capitalizeWords(`${item.firstName} ${item.lastName}`)}
    </List.Item>
  );

  const ModalBody = (
    <>
      <List header={kidGroup.room}>
        {kidGroup.list.map((item: any, index: any) => {
          return renderItem({ item, index });
        })}
      </List>
    </>
  );

  return (
    <>
      <Button
        style={{ marginTop: 5 }}
        onClick={toggleModal}
        block
        color="primary"
      >{`Ver listado ${kidGroup.room}`}</Button>
    </>
  );
};

export default ModalFaithForge;
