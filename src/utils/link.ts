import * as logger from './logger';
import { Linking } from 'expo';
import * as WebBrowser from 'expo-web-browser';
import { Article } from '../types';

/**
 * @param url 
 * @returns Promise opened successfully
 */
export async function openLink({
  url
}: {
  url: string
}): Promise<boolean> {
  if(await Linking.canOpenURL(url)) {
    try {
      await Linking.openURL(url);
      return true;
    } catch(err) {
      if(err.message)
      // Linking.canOpenURL() can lie
      // e.g if the user deletes the mail app
      // which will throw "Unable to open URL: name@example.com"
      if(!/^Unable to open URL:/.test(err.message)) {
        logger.logError(err);
      }
      // don't fall back to WebBrowser
      // to prevent another error
      return false;
    }
  } 
  
  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch(err) {
    logger.logError(err);
    return false;
  } 
}

export async function openLinkFromArticle({
  url,
  article
}: {
  url: string,
  article: Article
}) {
  const openedSuccessfully = await openLink({url});
  if(openedSuccessfully) {
    logger.logEvent({
      event: 'OpenArticleLink',
      props: {
        url: url,
        articleId: article.id,
        title: article.title,
        author: article.author
      }
    });
  }
}