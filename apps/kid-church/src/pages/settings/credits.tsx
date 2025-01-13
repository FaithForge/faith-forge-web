import type { NextPage } from 'next';
import NavBarApp from '../../components/NavBarApp';
import {
  Button,
  Card,
  Image,
  Grid,
  Space,
  Toast,
  Typography,
  Flex,
  ImagePreview,
} from 'react-vant';
import { Layout } from '../../components/Layout';
import TagKidGroupApp from '../../components/TagKidGroupApp';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

const Credits: NextPage = () => {
  return (
    <Layout>
      <NavBarApp title="Creditos" />
      <Grid gutter={10} columnNum={1} border={false} center={false}>
        <Grid.Item>
          <Typography.Title level={3} style={{ margin: 0 }} center={false}>
            Creadores
          </Typography.Title>
        </Grid.Item>
      </Grid>
      <Card round style={{ marginBottom: 20 }} border={true}>
        <Card.Body onClick={() => Toast.info('点击了Body区域')}>
          <Flex
            justify="center"
            align="center"
            gutter={16}
            style={{ paddingBottom: 10 }}
          >
            <Flex.Item span={8}>
              <Image
                alt="profileImage"
                src={'https://avatars.githubusercontent.com/u/67056384?v=4'}
                fit="cover"
                radius={100}
                style={{
                  marginTop: 10,
                  marginBottom: 10,
                  borderRadius: '50%',
                }}
                onClick={() =>
                  ImagePreview.open({
                    closeable: true,
                    showIndex: false,
                    images: [
                      'https://avatars.githubusercontent.com/u/67056384?v=4',
                    ],
                  })
                }
              />
            </Flex.Item>
            <Flex.Item span={16}>
              <h1
                style={{
                  fontSize: 28,
                  marginTop: 5,
                  marginBottom: 0,
                }}
              >
                Juan Carlos
              </h1>
              <h2
                style={{
                  fontSize: 20,
                  marginTop: 0,
                  marginBottom: 5,
                }}
              >
                Peña Merlano
              </h2>
              <TagKidGroupApp kidGroup={'Desarrollador de Software'} />
            </Flex.Item>
          </Flex>
        </Card.Body>
        <Card.Footer>
          <Space>
            <a href="https://www.linkedin.com/in/jucarlospm" target="_blank">
              <Button round size="small" icon={<FaLinkedin />}>
                Linkedin
              </Button>
            </a>
            <a href="https://github.com/jucarlospm" target="_blank">
              <Button icon={<FaGithub />} round color="#000" size="small">
                Github
              </Button>
            </a>
          </Space>
        </Card.Footer>
      </Card>
      <Card round style={{ marginBottom: 20 }} border={true}>
        <Card.Body onClick={() => Toast.info('点击了Body区域')}>
          <Flex
            justify="center"
            align="center"
            gutter={16}
            style={{ paddingBottom: 10 }}
          >
            <Flex.Item span={8}>
              <Image
                alt="profileImage"
                src={
                  'https://scontent.fctg3-1.fna.fbcdn.net/v/t39.30808-6/264653684_4679754688778896_25996609394231738_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeHuFMh79Gs67rTdBiBbxjvVcbSVmHZhtlpxtJWYdmG2WjyOcmY8e9MxCxdY1c_PH2U&_nc_ohc=eKHMw8nAS6kQ7kNvgEtFinf&_nc_zt=23&_nc_ht=scontent.fctg3-1.fna&_nc_gid=AxYaBS3i4o7EKtnNz-ZqmL6&oh=00_AYDdtyoAT4T_J_U3Fx4CFYvYPE0OnWui5_kKCnFzI3qcRg&oe=678AF3CF'
                }
                fit="cover"
                radius={100}
                style={{
                  marginTop: 10,
                  marginBottom: 10,
                  borderRadius: '50%',
                }}
                onClick={() =>
                  ImagePreview.open({
                    closeable: true,
                    showIndex: false,
                    images: [
                      'https://scontent.fctg3-1.fna.fbcdn.net/v/t39.30808-6/264653684_4679754688778896_25996609394231738_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeHuFMh79Gs67rTdBiBbxjvVcbSVmHZhtlpxtJWYdmG2WjyOcmY8e9MxCxdY1c_PH2U&_nc_ohc=eKHMw8nAS6kQ7kNvgEtFinf&_nc_zt=23&_nc_ht=scontent.fctg3-1.fna&_nc_gid=AxYaBS3i4o7EKtnNz-ZqmL6&oh=00_AYDdtyoAT4T_J_U3Fx4CFYvYPE0OnWui5_kKCnFzI3qcRg&oe=678AF3CF',
                    ],
                  })
                }
              />
            </Flex.Item>
            <Flex.Item span={16}>
              <h1
                style={{
                  fontSize: 28,
                  marginTop: 5,
                  marginBottom: 0,
                }}
              >
                Nataly
              </h1>
              <h2
                style={{
                  fontSize: 20,
                  marginTop: 0,
                  marginBottom: 5,
                }}
              >
                Fontalvo Vasquez
              </h2>
              <TagKidGroupApp kidGroup={'Ingeniera de Proyecto / Tester'} />
            </Flex.Item>
          </Flex>
        </Card.Body>
        <Card.Footer>
          <Space>
            <a
              href="https://www.linkedin.com/in/nataly-fontalvo-vasquez"
              target="_blank"
            >
              <Button round size="small" icon={<FaLinkedin />}>
                Linkedin
              </Button>
            </a>
            <a href="https://github.com/Natayufv10" target="_blank">
              <Button icon={<FaGithub />} round color="#000" size="small">
                Github
              </Button>
            </a>
          </Space>
        </Card.Footer>
      </Card>
      <Grid gutter={10} columnNum={1} border={false}>
        <Grid.Item>
          <Typography.Title level={5} style={{ margin: 0 }} center={true}>
            Hecho con ❤️ para Rios de Vida
          </Typography.Title>
        </Grid.Item>
      </Grid>
    </Layout>
  );
};

export default Credits;
