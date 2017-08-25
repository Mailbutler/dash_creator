class AddIndexesToDashCreatorTables < ActiveRecord::Migration[5.1]
  def change
    add_index :dash_creator_filters, :user_id
    add_index :dash_creator_charts, :user_id
    add_index :dash_creator_dashboards, :user_id

    add_index :dash_creator_filters, :created_at
    add_index :dash_creator_charts, :created_at
    add_index :dash_creator_dashboards, :created_at

    add_index :dash_creator_filters, :updated_at
    add_index :dash_creator_charts, :updated_at
    add_index :dash_creator_dashboards, :updated_at
  end
end
