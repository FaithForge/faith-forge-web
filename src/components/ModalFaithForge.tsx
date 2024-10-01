import { Button } from 'react-vant';

const ModalFaithForge = ({ kidGroup }: any) => {
  // const toggleModal = () => {
  //   Modal.show({
  //     content: ModalBody,
  //     showCloseButton: false,
  //     closeOnMaskClick: true,
  //     closeOnAction: true,
  //     actions: [
  //       {
  //         key: 'close',
  //         text: 'Cerrar',
  //         primary: true,
  //       },
  //     ],
  //   });
  // };

  // const renderItem = ({
  //   item,
  //   index,
  // }: {
  //   item: any;
  //   index: number;
  // }): React.ReactElement => (
  //   <List.Item
  //     key={index}
  //     description={`Genero: ${item.gender === 'M' ? 'Masculino' : 'Femenino'}`}
  //   >
  //     {capitalizeWords(`${item.fullName}`)}
  //   </List.Item>
  // );

  // const ModalBody = (
  //   <>
  //     <List header={kidGroup.room}>
  //       {kidGroup.list.map((item: any, index: any) => {
  //         return renderItem({ item, index });
  //       })}
  //     </List>
  //   </>
  // );

  return (
    <>
      <Button
        style={{ marginTop: 5 }}
        // onClick={toggleModal}
        block
        color="primary"
      >{`Ver listado ${kidGroup.kidGroup}`}</Button>
    </>
  );
};

export default ModalFaithForge;
