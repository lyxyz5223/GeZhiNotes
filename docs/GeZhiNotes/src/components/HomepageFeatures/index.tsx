import type {ReactNode} from 'react';
import clsx from 'clsx';
// import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '简单易用',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        格知笔记旨在提供一个简单易用的笔记平台，帮助用户快速上手并高效管理知识。
      </>
    ),
  },
  {
    title: '无限画布',
    Svg: require('@site/static/img/Feature_GeZhiNotes_Canvas.svg').default,
    description: (
      <>
        格知笔记提供无限画布功能，帮助用户自由组织和展示知识。
      </>
    ),
  },
  {
    title: '关系图谱',
    Svg: require('@site/static/img/Feature_GeZhiNotes_Mindmap.svg').default,
    description: (
      <>
        格知笔记帮助用户构建知识之间的关系图谱，轻松管理笔记内容。
      </>
    ),
  },
  {
    title: 'AI 助手',
    Svg: require('@site/static/img/Feature_GeZhiNotes_AI.svg').default,
    description: (
      <>
        格知笔记集成 AI 助手，提供智能化的笔记管理和知识推荐。
      </>
    ),
  }
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
