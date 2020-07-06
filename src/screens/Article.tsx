import React, { useState, useEffect } from 'react';
import { View, StatusBar, NativeScrollEvent, Image, Platform } from 'react-native';
import HTMLView from 'react-native-htmlview';
import { logEvent } from '../utils/logger';
import { useNavigation } from '@react-navigation/core';
import { shareArticle, shareUrl, openLinkFromArticle, useFreshContent, styleHelpers } from '../utils';
import { Surface, Theme, Icon, ActivityIndicator, Section, ScrollViewWithHeader, Button, Text, Byline } from '../components';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { actions, GetArticle } from '../shared/src/client';
import NotFoundScreen from './NotFound';
import { FontAwesome } from '@expo/vector-icons';
import { useHideBottomTabBar } from '../store/ducks/navigation';


const IMAGE_HEIGHT = 320;


function ArticleWithoutState({
  article,
  image
}: {
  article: GetArticle | null | undefined,
  image: React.ReactNode
}) {

  const { insets, dark } = Theme.useTheme();
  const [ finished, setFinished ] = useState(false);
  const navigation = useNavigation();
  const styles = Theme.useStyleCreator(styleCreator);

  useHideBottomTabBar();

  function goBack() {
    if(navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  }

  function onShare() {
    if(article) {
      shareArticle({article, feedback: false});
    }
  }

  function checkFinish({nativeEvent}: {nativeEvent: NativeScrollEvent}) {
    if(!article || finished) return;
    function isCloseToBottom() {
      const {layoutMeasurement, contentOffset, contentSize} = nativeEvent;
      return layoutMeasurement.height + contentOffset.y >=
             (contentSize.height - insets.bottom) * 0.8;
    }
    if(isCloseToBottom()) {
      setFinished(true);
      logEvent({
        event: 'FinishedArticle',
        props: {
          id: article.id,
          title: article.title,
          author: article.authors.join(', ')
        }
      });
    }
  }

  return (
    <View 
      style={styles.container}
      onLayout={() => {}}
    >
      <StatusBar animated={true} hidden={Platform.OS === 'ios'}/>
      {article ? (
        <ScrollViewWithHeader
          indicatorStyle={dark ? 'white' : 'black'}
          Header={image}
          headerHeight={IMAGE_HEIGHT}
          onScrollEndDrag={checkFinish}
          style={{height: '100%'}}
        > 
          <View style={styles.page}>
            <Section style={styles.article}>
              <Text style={styles.title}>{article.title}</Text>
              <View style={styles.spacer}/>
              <Byline
                authors={article.authors}
                updatedAt={article.updatedAt}
                publishDate={article.publishDate}
              />
              <View style={styles.spacer}/>
              <HTMLView
                addLineBreaks={false}
                onLinkPress={(url) => openLinkFromArticle({url, article})}
                onLinkLongPress={shareUrl}
                stylesheet={styles}
                value={article.body}
              />
            </Section>
            <Section innerStyle={styles.shareSection}>
              <Button onPress={onShare}> 
                {Platform.OS === 'ios' ? (
                  <Icon
                    size={38}
                    color={styles.buttonText.color}
                    name='share'
                  />
                ) : (
                  <FontAwesome
                    size={26}
                    color={styles.buttonText.color}
                    name='share-alt'
                    style={{
                      padding: 8,
                      paddingLeft: 0,
                      paddingRight: 12
                    }}
                  />
                )}
                <Text style={styles.buttonText}>Share Article</Text>
              </Button>
            </Section>
          </View>
        </ScrollViewWithHeader>
      ): <ActivityIndicator.Screen/>}

      {article === undefined ? (
        <ActivityIndicator.Screen/>
      ) : null}

      {article === null ? (
        <NotFoundScreen/>
      ) : null}

      <Section style={{
        position: 'absolute',
        width: '100%'
      }}>
        <Surface style={styles.closeIcon}>
          <Icon
            size={38}
            onPress={goBack}
            color={styles.closeButtonText.color}
            name='back-android'
          />
        </Surface>
      </Section>
    </View>
  );
}

const styleCreator = Theme.makeStyleCreator(theme => ({
  container: {
    ...styleHelpers.container(theme),
    backgroundColor: theme.colors.background
  },
  page: {
    ...styleHelpers.page(theme)
  },
  share: {
    color: '#fff',
  },
  hide: {
    display: 'none'
  },
  closeIcon: {
    position: 'absolute',
    top: 16 + (Platform.OS !== 'ios' ? theme.insets.top - 5 : 5),
    left: 16 + (Platform.OS !== 'ios' ? 0 : 5),
    height: 32,
    width: 32,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  article: {
    flex: 1,
    paddingBottom: 0,
    height: '100%'
  },
  image: {
    height: '100%'
  },
  imageSpacer: {
    height: 45 + (Platform.OS !== 'ios' ? theme.insets.top : 10),
  },
  previewBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  preview: {
    borderRadius: theme.roundness(),
    overflow: 'hidden'
  },
  previewTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 18
  },
  previewText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 28
  },
  // Text Styles
  title: {
    fontWeight: '800',
    fontSize: 32,
    lineHeight: 36
  },
  author: {
    color: theme.colors.accent,
    fontSize: 18,
    marginBottom: theme.spacing(0.6)
  },
  date: {
    color: theme.colors.textMuted,
    fontSize: 14
  },
  p: {
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: theme.spacing(2)
  },
  a: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: theme.spacing(2),
    color: theme.colors.accent,
    textDecorationLine: 'underline'
  },
  shareSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: theme.spacing(2) + theme.insets.bottom,
  }, 
  buttonText: {
    fontSize: 18,
    color: theme.colors.accent
  },
  closeButtonText: {
    color: theme.dark ? 'rgba(0,0,0,0.9)' : '#fff'
  },
  spacer: {
    height: theme.spacing(2)
  }
}));

export function Article({
  route
}: {
  route: any
}) {
  const params = route.params;
  const [ article, setArticle ] = useState<GetArticle | null | undefined>();
  const styles = Theme.useStyleCreator(styleCreator);
  const slug = `article/${params.year}/${params.month}/${params.slug}`;

  useFreshContent(() => {
    let isCancled = false;
    actions.getArticle({
      id: params.id, 
      slug
    })
    .then(res => {
      // res will be null if
      // the page isn't found
      if(!isCancled) {
        setArticle(res);
      }
    });
    return () => {
      isCancled = true;
    }
  }, [params.id, slug]);

  return (
    <ArticleWithoutState
      article={article}
      image={(article && article.media) ? (
        <Image
          source={{uri: article.media[0]+'?h=1000&w=1000&fit=crop&crop=faces,center'}}
          style={styles.image}
          resizeMethod="resize"
        />
      ): null}
    />
  )
}

Article.Preview = Preview;
function Preview({
  route
}: {
  route: any
}) {
  const params = route.params;
  const [ article, setArticle ] = useState<GetArticle | null | undefined>();
  const styles = Theme.useStyleCreator(styleCreator);
  const theme = Theme.useTheme();

  function refreshContent() {
    actions.getArticlePreview({
      id: params.id
    })
    .then(res => {
      // res will be null if
      // the page isn't found
      setArticle(res);
    });
  }

  useFreshContent(() => {
    actions.getArticlePreview({
      id: params.id
    })
    .then(res => {
      refreshContent()
    });
  }, [params.id]);

  useEffect(() => {
    refreshContent();
  }, [params.id]);

  return (
    <View style={{flex: 1}}>
      <ArticleWithoutState
        article={article}
        image={(article && article.media) ? (
          <Image
            source={{uri: article.media[0]}}
            style={styles.image}
            resizeMethod="resize"
          />
        ): null}
      />
      {article ? (
        <View style={styles.previewBackdrop} pointerEvents='box-none'>
          <Surface style={styles.preview} tint='dark'>
            <TouchableHighlight
              underlayColor={theme.colors.touchableHighlight}
              onPress={refreshContent}
            >
              <View style={styles.previewTouchable}>
                <Text style={styles.previewText}>Preview</Text>
                <Icon size={42} name='refresh'/>
              </View>
            </TouchableHighlight>
          </Surface>
        </View>
      ) : null}
    </View>
  )
}

export default Article;