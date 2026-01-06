/**
 * User Notifications Routes
 */

import { Hono } from 'hono'
import {
  QueryCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { docClient, TABLE_NAMES } from '../../shared/db/client'
import { requireAuth, getUser } from '../../shared/middleware/auth'

const app = new Hono()

/**
 * GET /
 * Get all notifications for the current user
 */
app.get('/', requireAuth(), async (c) => {
  try {
    const user = getUser(c)

    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.NOTIFICATIONS,
        IndexName: 'user_id-sent_at-index',
        KeyConditionExpression: 'user_id = :userId',
        ExpressionAttributeValues: {
          ':userId': user.sub,
        },
        ScanIndexForward: false, // Latest first
      }),
    )

    return c.json({
      success: true,
      data: result.Items,
      count: result.Count,
    })
  } catch (error) {
    console.error('[notifications] Error fetching notifications:', error)
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500)
  }
})

/**
 * PATCH or PUT /:id/read
 * Mark a notification as read
 */
app.on(['PATCH', 'PUT'], '/:id/read', requireAuth(), async (c) => {
  try {
    const { id } = c.req.param()
    const user = getUser(c)

    // First check if notification belongs to user
    const checkResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.NOTIFICATIONS,
        Key: { id },
      }),
    )

    if (!checkResult.Item || checkResult.Item.user_id !== user.sub) {
      return c.json({ success: false, error: 'Notification not found' }, 404)
    }

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.NOTIFICATIONS,
        Key: { id },
        UpdateExpression: 'SET #read = :read',
        ExpressionAttributeNames: {
          '#read': 'read',
        },
        ExpressionAttributeValues: {
          ':read': true,
        },
      }),
    )

    return c.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error('[notifications] Error marking as read:', error)
    return c.json({ success: false, error: 'Failed to update notification' }, 500)
  }
})

/**
 * DELETE /:id
 * Delete a notification
 */
app.delete('/:id', requireAuth(), async (c) => {
  try {
    const { id } = c.req.param()
    const user = getUser(c)

    // First check if notification belongs to user
    const checkResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.NOTIFICATIONS,
        Key: { id },
      }),
    )

    if (!checkResult.Item || checkResult.Item.user_id !== user.sub) {
      return c.json({ success: false, error: 'Notification not found' }, 404)
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.NOTIFICATIONS,
        Key: { id },
      }),
    )

    return c.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('[notifications] Error deleting notification:', error)
    return c.json({ success: false, error: 'Failed to delete notification' }, 500)
  }
})

export default app
